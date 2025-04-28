"use strict";
let Promise = require('bluebird'),
    _ = require('lodash'),
    Base = require('./base'),
    Boom = require('boom'),
    UserService = require("./user-service.js"),
    SupportTicketService = require("./support-ticket-service.js"),
    TenantService = require("./tenant-service.js"),
    StatusService = require("./status-service.js"),
    LookupData = require('./lookup-data'),
    SeedUtility = require('../utils/seed-utility'),
    ImportHelper = require("../utils/import-helper.js"),
    CSVStream = require('csv-parse'),
    JSONStream = require('JSONStream'),
    stream = require('stream');

module.exports = class ImportService extends Base {
    constructor(request, tenantId) {
        super(request);
        this.tenantId = tenantId || request.params.tenantId;
        this.lookupData = new LookupData(request);
        this.userService = new UserService(request);
        this.supportTicketService = new SupportTicketService(request);
        this.tenantService = new TenantService(request);
        this.statusService = new StatusService(request);
        this.Form = this.getModel('Form');
        this.User = this.getModel('User');
        this.Role = this.getModel('Role');
        this.ResponseTemplate = this.getModel('ResponseTemplate');
        this.Attachment = this.getModel('Attachment');
    }
    importSettings(settings, clearExisting) {
        settings = settings[0];
        settings.statusTypes = settings.statusTypes && _.isArray(settings.statusTypes) ? settings.statusTypes : [];

        console.log('import status types...');
        var tickets =  this.knex('supportTickets').where('tenantId', this.tenantId).select('id');
        var forms   =  this.knex('forms').where('tenant_id', this.tenantId).select('id');

        // if clearExisting is enabled, clear out all forms and tickets
        return (clearExisting && this.credentials.su  ?
            Promise.all([
                    this.knex('notes'      ).where('supportTicketId', 'in', tickets).del(),
                    this.knex('comments'   ).where('supportTicketId', 'in', tickets).del(),
                    this.knex('attachments').where('supportTicketId', 'in', tickets).del(),
                    this.knex('responseTemplates').where(   'formId', 'in', forms  ).del(),
                    this.knex('supportTicketHistory'     ).where('tenantId',  this.tenantId).del()
                ])
                .then(del   => this.knex('supportTickets').where('tenantId',  this.tenantId).del())
                .then(del   => this.knex('forms'         ).where('tenant_id', this.tenantId).del()) : Promise.resolve())
            .then(start => Promise.map(settings.statusTypes, status => this.statusService.createStatus(status)))
            .then(types => this.lookupData.getLookupData(this.tenantId))
            .tap(lookup => lookup.tenant.load(['roles', 'forms']))
            .tap(lookup => {
                if (settings.roles && _.isArray(settings.roles)){
                    console.log('import roles...');
                    var newRoles = false;
                    return Promise.map(settings.roles, role =>{
                        let existing = _.find(lookup.tenant.related('roles').toJSON(), {name: role.name});
                        if (!existing){
                            newRoles = true;
                            console.log('adding new role');
                            return new this.Role({
                                name: role.name,
                                canEdit: true,
                                "default": role.default,
                                tenant_id: this.tenantId,
                                permissions: {
                                    access: role.permissions
                                }
                            }).save().then(() => lookup.tenant.related('roles').fetch());
                        }else if (existing.canEdit){
                            console.log('updating existing role permissions');
                            return new this.Role({id: existing.id}).save({
                                "default": role.default,
                                permissions: {
                                    access: role.permissions || existing.permissions.access
                                }
                            }, {patch:true});
                        }
                    });
                }
            })
            .tap(lookup => {
                if (settings.forms && _.isArray(settings.forms)){
                    console.log('import forms...', settings.forms);
                    return Promise.map(settings.forms, form => {
                        console.log(form.name);

                        let existing = _.find(lookup.tenant.related('forms').toJSON(), {name: form.name});

                        let roles = lookup.tenant.related('roles').map(role => {
                            let r = _.find(form.roles, {name: role.name});
                            if (r) {
                                return {
                                    id: role.id,
                                    name: role.name,
                                    isReadOnly: r.isReadOnly,
                                    canCreateTicket: r.canCreateTicket,
                                    canBeAssigned: r.canBeAssigned,
                                    notifications: r.notifications
                                };
                            }else{
                                return {
                                    id: role.id,
                                    name: role.name,
                                    isReadOnly: false,
                                    canCreateTicket: true,
                                    canBeAssigned: true
                                };
                            }
                        });
                        form.statusTypes = _.map(form.statusTypes, type => {
                            let s = _.find(lookup.statusTypes, {name: type.name});
                            if (!s){
                                return undefined;
                            }else{
                                type.id = s.id;
                            }
                            return type;
                        });

                        if (!existing){
                            console.log('add new form');
                            return new this.Form({
                                name: form.name,
                                tenant_id: this.tenantId,
                                settings:        {details: form.settings || {}},
                                roles:     {assignedRoles: roles || []},
                                statusTypes:   {statusIds: form.statusTypes || []},
                                ticketTemplate: {controls: form.ticketTemplate || []}
                            }).save().then(form => 
                                    new this.ResponseTemplate({
                                    template: {responseTemplates: form.responseTemplates},
                                    formId: form.id,
                                    createdBy: this.credentials.id,
                                    updatedBy: this.credentials.id
                                }).save());
                        }else{
                            console.log('update existing form');
                            return new this.Form({id: existing.id}).save({
                                deleted: false,
                                settings:        {details: _.extend(existing.settings.details, form.settings)},
                                roles:     {assignedRoles: _.uniqBy(roles.concat(existing.roles.assignedRoles), 'id')},
                                statusTypes: {"statusIds": _.uniqBy(form.statusTypes.concat(existing.statusTypes.statusIds), 'id')},
                                ticketTemplate: {controls: _.uniqBy(form.ticketTemplate.concat(existing.ticketTemplate.controls), 'name')}
                            }, {patch:true});
                        }

                    });
                }
            })
            .tap(lookup => {
                if (settings.userTemplate || settings.tenantSettings || tenantSettings.settings ){
                    settings.userTemplate = settings.userTemplate && _.isArray(settings.userTemplate) ? settings.userTemplate : [];

                    if (clearExisting && this.credentials.su){
                        return this.tenantService.updateTenant (this.tenantId, {
                            userTemplate:  {controls: settings.userTemplate},
                            tenantSettings:{settings: _.extend(lookup.tenant.get('tenantSettings').settings, settings.tenantSettings || {})}
                        });
                    }else{
                        return this.tenantService.updateTenant (this.tenantId, {
                            userTemplate:  {controls: _.uniqBy(settings.userTemplate.concat(lookup.tenant.get('userTemplate').controls), 'name')},
                            tenantSettings:{settings: _.extend(lookup.tenant.get('tenantSettings').settings, settings.tenantSettings || {})}
                        });
                    }
                }
            }).then(
                success => ({success: true})
            );
    }

    importTickets (file, formId, defaultUser, clearExisting) {
        let $$ = this.knex.raw,
            ext = file.hapi.filename.substr(file.hapi.filename.lastIndexOf('.')).toUpperCase();

        return Promise.all([
            this.lookupData.getLookupData (this.tenantId).tap(lookup => lookup.tenant.load('roles')),
            this.lookupData.getTenantUsers(this.tenantId)
        ]).then(p => {
            let lookup = p[0], users = p[1];
            let importer = new ImportHelper(users, lookup, formId);

            // these are the functions to pass into addTransform

            let matchId = id => this.knex('supportTickets')
                .where('tenantId', this.tenantId).andWhere({id}).select('*');
            let matchShadowId = id => this.knex('supportTickets')
                .where('tenantId', this.tenantId).andWhere(this.knex.raw("metadata->>'importKey'"), id).select('*');
            let insert = record => this.supportTicketService.insertTicket({
                    formId: formId,
                    createdBy: importer.lookupUser(record.createdBy || record.creator, defaultUser),
                    updatedBy: importer.lookupUser(record.createdBy || record.creator, defaultUser),
                    assignedTo: importer.lookupUser(record.assignedTo, null),
                    created_at: importer.lookupDate(record.createdDate || record.created),
                    updated_at: importer.lookupDate(record.updatedDate || record.updated),
                    statusType: importer.lookupStatus(record.statusType || record.status),
                    metadata: importer.lookupMetadata(record)
                }, false).then(supportTicket => {
                    Promise.all([
                        Promise.map(record.comments || [], c =>
                                this.supportTicketService.insertComment({
                                    content: c.content,
                                    createdBy: importer.lookupUser(c.createdBy || c.creator, defaultUser),
                                    supportTicketId: supportTicket.id
                                }, false).tap(comment => {
                                    if (c.created || c.createdDate) {
                                        return comment.save({created_at: importer.lookupDate(c.createdDate || c.created)}, {
                                            method: 'update',
                                            patch: true});
                                    } else {
                                        return comment;
                                    }
                                })),
                        Promise.map(record.notes || [], c =>
                            this.supportTicketService.insertNote({
                                content: c.content,
                                createdBy: importer.lookupUser(c.createdBy || c.creator, defaultUser),
                                supportTicketId: supportTicket.id
                            }, false).tap(note => {
                                if (c.created || c.createdDate) {
                                    return note.save({created_at: importer.lookupDate(c.createdDate || c.created)}, {
                                        method: 'update',
                                        patch: true});
                                } else {
                                    return note;
                                }
                            })),
                        Promise.map(record.attachments || [], c =>
                            new this.Attachment({
                                filename: c.filename,
                                bucket: c.bucket,
                                createdBy: importer.lookupUser(c.createdBy || c.creator, defaultUser),
                                supportTicketId: supportTicket.id
                            }).save().tap(attachment => {
                                if (c.created || c.createdDate) {
                                    return attachment.save({created_at: importer.lookupDate(c.createdDate || c.created)}, {
                                        method: 'update',
                                        patch: true});
                                } else {
                                    return attachment;
                                }
                            }))
                    ]);
                })
                .then(
                    supportTicket => ( {success: true, id: supportTicket.id}),
                    error => ({success: false, reason: ImportHelper.getErrorMessage(error)}));

            // code starts here ////////////////////////////////////////////////////////////////////////////////////////
            var tickets =  this.knex('supportTickets').where('formId', formId).andWhere('tenantId', this.tenantId).select('id');

            // console.log(clearExisting, this.credentials.su);
            return (clearExisting && this.credentials.su  ?
                Promise.all([
                        this.knex('notes'      ).where('supportTicketId', 'in', tickets).del(),
                        this.knex('comments'   ).where('supportTicketId', 'in', tickets).del(),
                        this.knex('attachments').where('supportTicketId', 'in', tickets).del(),
                        this.knex('supportTicketHistory').where('supportTicketId', 'in', tickets).del()
                    ])
                    .then(del   => this.knex('supportTickets').where('formId', formId)
                        .andWhere('tenantId', this.tenantId).del()): Promise.resolve())
                .then(start => {

                    if (ext === ".CSV") {
                        return file.pipe(CSVStream({trim: true}))
                            .pipe(ImportHelper.CSVtoJSON())
                            .pipe(ImportHelper.addTransform(insert, matchId, matchShadowId))
                            .pipe(JSONStream.stringify())
                            .pipe(stream.PassThrough());
                    } else if (ext === ".JSON" || ext === ".JS") {
                        return file.pipe(JSONStream.parse('*'))
                            .pipe(ImportHelper.addTransform(insert, matchId, matchShadowId))
                            .pipe(JSONStream.stringify())
                            .pipe(stream.PassThrough());
                    } else {
                        return Promise.reject(Boom.badRequest("File must be CSV or JSON"));
                    }

                });
        });
    }
    importUsers (file, clearExisting) {
        let ext = file.hapi.filename.substr(file.hapi.filename.lastIndexOf('.')).toUpperCase();

        return Promise.all([
            this.lookupData.getLookupData(this.tenantId).tap(lookup => lookup.tenant.load('roles')),
            this.lookupData.getTenantUsers(this.tenantId),
            new this.User().fetchAll()
        ]).then(p => {
            let lookup = p[0], users = p[2].toJSON(), tenantUsers = _.map(p[1], 'id');
            let seedUtility = new SeedUtility();

            // function to pass into addTransform

            let insert = record => {
                let importer = new ImportHelper(users, lookup);
                let metadata = importer.lookupMetadata(record);
                let role = importer.lookupRole(record.role);
                let existingUserId = importer.lookupUser(record.email, null);
                record.email = record.email.toLowerCase().trim();

                // kind of a hack - if the user exists in another tenant, add him to this one
                if (existingUserId && tenantUsers.indexOf(existingUserId) === -1) {
                    console.log('invite user "' + record.email + '"');
                    return new this.User({id: existingUserId})
                        .fetch({withRelated: [{'tenants': qb => qb.where('tenant_id', this.tenantId)}, 'tenants.roles']})
                        .then (existingUser => {
                            //add to the tenant using the default role
                            if (existingUser) {
                                return this.userService.addExistingUserToTenant(existingUser, lookup.tenant, role, metadata, true);
                            }else{
                                return Promise.reject(Boom.conflict('This user was not found.'));
                            }
                        })
                        .then(
                            user => ({success: true, id: user.id}),
                            error => ({success: false, reason: ImportHelper.getErrorMessage(error)}));


                    //return this.userService.inviteUserToTenant({
                    //    email: record.email.trim(),
                    //    role_id: role,
                    //    user_metadata: metadata
                    //})
                    //    .then(
                    //        user => ({success: true, id: user.id}),
                    //        error => ({success: false, reason: ImportHelper.getErrorMessage(error)}));

                    // of if it's new, make a new user
                } else if (!existingUserId) {
                    console.log('add user "' + record.email + '"');
                    return seedUtility.addUser(this.knex, record.name, record.email, record.password, [{
                        id: this.tenantId,
                        role: role
                    }]).tap(id => {
                        users.push({email: record.email, name: record.name.trim(), id: id});
                        if (metadata) {
                            console.log('metadata');
                            return new this.User({id})
                                .setMetadata(importer.lookupMetadata(record), true, this.tenantId);
                        }
                    }).then(
                        id => ({success: true, id: id}),
                        error => ({success: false, reason: ImportHelper.getErrorMessage(error)}));

                    // otherwise we're all good.
                } else {
                    console.log('existing user "' + record.email + '"');
                    return Promise.resolve({success: false, reason: 'User Already Exists'});
                }
            };

            // code starts here ////////////////////////////////////////////////////////////////////////////////////////
            return (clearExisting && this.credentials.su ?
                this.knex('users_roles')
                    .where('role_id', 'in', _.map(lookup.tenant.related('roles').toJSON(), 'id'))
                    .andWhere('user_id', '<>', this.credentials.id)
                    .del()
                    .then(() => this.knex('tenants_users')
                        .where('tenant_id', this.tenantId)
                        .andWhere('user_id', '<>', this.credentials.id)
                        .del())
                    .then(() => this.knex('pendingAddUsers')
                        .where('tenant_id', this.tenantId)
                        .del())
                    .then(() => new this.User().fetchAll())
                    .then(u => {
                        tenantUsers = [this.credentials.id];
                        users = u.toJSON();
                    }):
                Promise.resolve()).then( startTheParse => {
                if (ext === ".CSV") {
                    return file.pipe(CSVStream({trim: true}))
                        .pipe(ImportHelper.CSVtoJSON())
                        .pipe(ImportHelper.addTransform(insert))
                        .pipe(JSONStream.stringify())
                        .pipe(stream.PassThrough());
                } else if (ext === ".JSON" || ext === ".JS") {
                    return file.pipe(JSONStream.parse('*'))
                        .pipe(ImportHelper.addTransform(insert))
                        .pipe(JSONStream.stringify())
                        .pipe(stream.PassThrough());
                } else {
                    return Promise.reject(Boom.badRequest("File must be CSV or JSON"));
                }
            });

        });
    }
};
