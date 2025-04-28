"use strict";
let Promise = require("bluebird"),
    Base = require('./base.js'),
    Boom = require('boom'),
    _ = require('lodash'),
    EmailService = require('./send-email-service.js'),
    sf = require('slice-file'),
    Readable = require('stream').Readable;

    module.exports = class SuService extends Base {
        constructor(request){
            super(request);
            this.Settings = this.getModel('Setting');
            this.Newsletters = this.getModel('Newsletter');
            this.User = this.getModel('User');
            this.Role = this.getModel('Role');
            this.StatusType = this.getModel('StatusType');
            this.Form = this.getModel('Form');
            this.Tenant = this.getModel('Tenant');
        }

        getAllTenants () {
            let users = this.knex('tenants_users').count('*').where('tenant_id', this.knex.raw('tenants.id')).as('users');
            let tickets = this.knex('supportTickets').count('*').where('tenantId', this.knex.raw('tenants.id')).andWhere('deleted', false).as('tickets');

            return this.knex('tenants').select('*', users,tickets);
        }

        getAllSettings () {
            return new this.Settings().fetchAll();
        }

        getAllNewsLetters () {
            return new this.Newsletters().fetchAll();
        }

        getAllSuperUsers(){
            return new this.User().where({su: true, deleted: false}).fetchAll();
        }

        addSuperUser (email) {
            return this.Bookshelf.transaction(t =>
                 new this.User().where({email: email.toLowerCase().trim()})
                    .fetch()
                    .then(user => {
                        if (user){
                            return user.save({su: true}, {patch: true});
                        }else{
                            return Promise.reject(Boom.expectationFailed('The specified user was not found.'));
                        }
                    }).then(() => this.getAllSuperUsers())
            );
        }

        removeSuperUser (userId) {
            return this.Bookshelf.transaction(t => {
                return new this.User({id: userId})
                    .fetch()
                    .then(user =>{
                        if (user){
                            return user.save({su: false}, {patch: true});
                        }else{
                            return Promise.reject(Boom.notFound('The specified user was not found.'));
                        }
                    }).then(() => this.getAllSuperUsers());
            });
        }

        updateSetting(payload) {
            return new this.Settings().where({'key':payload.key}).fetch().then(setting =>
                setting.save({'value': payload.value}, {patch:true})
                    .then(settings => settings, err => Promise.reject(Boom.badRequest(err)))
            );
        }

        createTenant (payload) {
            return this.getAllSettings().then(settings =>
                this.Bookshelf.transaction(t => {
                    return new this.Tenant({
                        tier: payload.tier,
                        name: payload.name,
                        apiConnectivity: payload.apiConnectivity,
                        userTemplate: payload.userTemplate,
                        tenantSettings: payload.tenantSettings
                    }).save(null, {transacting: t})
                        .then(tenant => Promise.join(
                            new this.Role({
                                name: "Admin",
                                canEdit: false,
                                default: false,
                                permissions: settings.findWhere({key: 'adminPermissions'}).get('value'),
                                tenant_id: tenant.id
                            }).save(null, {transacting: t}),
                            new this.Role({
                                name: "User",
                                canEdit: false,
                                default: true,
                                permissions: settings.findWhere({key: 'userPermissions'}).get('value'),
                                tenant_id: tenant.id
                            }).save(null, {transacting: t}),
                            new this.Role({
                                name: "Support",
                                canEdit: true,
                                default: false,
                                permissions: settings.findWhere({key: 'supportUserPermissions'}).get('value'),
                                tenant_id: tenant.id
                            }).save(null, {transacting: t}),
                            new this.StatusType({
                                name: "Open",
                                workflowActionName: 'Open',
                                tenantId: tenant.id,
                                color: '#F39C12'
                            }).save(null, {transacting: t}),
                            new this.StatusType({
                                name: "Closed",
                                workflowActionName: 'Close',
                                tenantId: tenant.id,
                                color: '#27AE60'
                            }).save(null, {transacting: t}),
                            (adminRole, userRole, supportRole, openStatusType, closedStatusType) => {
                                return new this.Form({
                                    name: 'Ticket',
                                    tenant_id: tenant.id,
                                    ticketTemplate: payload.ticketTemplate,
                                    roles: {
                                        "assignedRoles": [
                                            {
                                                "id": adminRole.id,
                                                "name": "Admin",
                                                "canBeAssigned": true,
                                                "canCreateTicket": true
                                            },
                                            {
                                                "id": userRole.id,
                                                "name": "User",
                                                "canBeAssigned": false,
                                                "canCreateTicket": false
                                            },
                                            {
                                                "id": supportRole.id,
                                                "name": "Support",
                                                "canBeAssigned": true,
                                                "canCreateTicket": true
                                            }
                                        ]
                                    },
                                    deleted: false,
                                    color: 'primary',
                                    settings: {"details": {"icon": "fa-ticket"}},
                                    statusTypes: {
                                        "statusIds": [{
                                            "id": openStatusType.get('id'),
                                            "isWorkFlow": true
                                        }, {"id": closedStatusType.get('id'), "isWorkFlow": true}]
                                    }
                                }).save(null, {transacting: t});
                            }
                        ));
                })
            );
        }

        updateTenant (tenantId, payload) {
            return this.Bookshelf.transaction(t =>
                new this.Tenant({id: tenantId}).fetch().then(existingTenant => {
                    if (existingTenant === null) {
                        return Promise.reject(Boom.notFound("Tenant does not exist"));
                    } else {
                        let tenantSettings = existingTenant.get('tenantSettings');
                        tenantSettings.settings.emailNotification = payload.tenantSettings.settings.emailNotification;
                        return existingTenant.save({
                            name: payload.name,
                            apiConnectivity: payload.apiConnectivity,
                            deleted: payload.deleted,
                            tier: payload.tier,
                            //ticketTemplate: request.payload.ticketTemplate,
                            userTemplate: payload.userTemplate,
                            tenantSettings: tenantSettings
                        }, {patch: true, transacting: t});
                    }
                })
            );
        }

        getNodeLog(path) {

            return new Promise((resolve, reject) => {
                try {
                    let xs = null;
                    if(process.env.NODE_ENV == 'local') {
                        xs = sf(
                            path.join(__dirname,'../../README.md')
                        )
                    } else {
                        xs = sf(
                            '/var/log/web.stdout.log'
                        );
                    }

                    let result = new Readable().wrap(xs.sliceReverse(-300), {encoding: 'utf8'});
                    resolve(result);

                } catch(err){
                    console.log('SUPER ADMIN LOG ERROR:', err);
                    reject(new Error('Error: ' + err));
                }
            });
        }
    };
