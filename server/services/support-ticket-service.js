 "use strict";

    let Promise = require("bluebird"),
        _ = require('lodash'),
        QueryBuilder = require("../utils/query-builder.js"),
        NotificationService = require("./notification-service.js"),
        PermissionsService = require("./permissions-service.js"),
        LookupData = require('./lookup-data'),
        Boom = require('boom'),
        deep = require('deep-diff'),
        Base = require('./base.js'),
        observableDiff = require('deep-diff').observableDiff,
        applyChange  = require('deep-diff').applyChange;

    module.exports = class SupportTicketService extends Base {
        constructor(request, tenantId){
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.User = this.getModel('User');
            this.SupportTicket = this.getModel('SupportTicket');
            this.SupportTicketHistory = this.getModel('SupportTicketHistory');
            this.Tenant = this.getModel('Tenant');
            this.permissions = new PermissionsService(this.credentials);
            this.notify = new NotificationService(request);
            this.lookupData = new LookupData(request);
        }

        undelete(ticketId) {
            return this.Bookshelf.transaction(t =>
                new this.SupportTicket({id: ticketId})
                    .fetch({withRelated: ['statusType', 'assignedUser', 'updatedByUser']})
                    .then(this.checkExists("This ticket does not exist"))
                    .then((ticket) => {
                        //return ticket.save({deleted:false}, {patch: true, transacting: t});
                        let originalTicket = _.cloneDeep(ticket.toJSON());
                        return ticket.save({
                            deleted:false,
                            archived: false,
                            updatedBy: this.credentials.id
                        }, {patch: true, transacting: t})
                            .then((updatedSupportTicket) => updatedSupportTicket.load(['form', 'statusType', 'assignedUser', 'updatedByUser']))
                            .tap ((supportTicket) => this.addHistory(originalTicket, supportTicket, t, false));
                    })
            ).then((supportTicket) => this.getTicketById(ticketId));
        }

        update (model) {
            let statusChanged = false,
                assignedToChanged = false;

            model.tenantId = this.tenantId;

            return this.Bookshelf.transaction(t =>
                new this.SupportTicket({id: model.id})
                    .where({'supportTickets.tenantId': this.tenantId})
                    .fetch({withRelated: ['statusType', 'assignedUser', 'updatedByUser']})  //all needed by history!!!
                    .then(this.checkExists("This ticket does not exist"))
                    .tap(supportTicket => {
                        if (supportTicket.get('statusType') !== model.statusType) {
                            statusChanged = true;
                        }

                        if (supportTicket.related('assignedUser') && model.assignedTo && supportTicket.related('assignedUser').get('id') !== model.assignedTo) {
                            assignedToChanged = true;
                        }
                        model.updatedBy = this.credentials.id; //store who is updating

                        return this.permissions.validate(
                            this.credentials.id === supportTicket.get('createdBy') ||
                            this.credentials.id === supportTicket.get('assignedTo') ||
                            this.permissions.allowed("CanManageTickets", this.tenantId));

                    })
                    .then((supportTicket) => {
                        let originalTicket = _.cloneDeep(supportTicket.toJSON());
                        return supportTicket.setMetadata(model.metadata, this.permissions.allowed("CanManageTickets", this.tenantId))
                            .catch(err => Promise.reject(Boom.badRequest(err)))
                            .then( ticket => ticket.save(model, {patch: true, transacting: t}))
                            .then( updatedSupportTicket => updatedSupportTicket.load(['form', 'statusType', 'assignedUser', 'updatedByUser']))
                            .tap ( model => this.addHistory(originalTicket, model, t, false));
                    }))
                .then(supportTicket => this.getTicketById(supportTicket.get('id')))
                .then(ticket => {
                    this.lookupData.getLookupData(this.tenantId).then(lookup => this.notify.ticketUpdated(ticket.toJSON(), lookup.tenant.get('tenantSettings').settings.emailNotification));
                    return ticket.set('statusHasChanged', statusChanged);
                });
        }
        markDeleted (id) {
            return this.Bookshelf.transaction(t =>
                new this.SupportTicket().where({id, tenantId: this.tenantId})
                .fetch({withRelated: ['statusType', 'assignedUser', 'updatedByUser']})  //all needed by history!!!
                .then(this.checkExists("This ticket does not exist"))
                .then(supportTicket => {
                    let originalTicket = _.cloneDeep(supportTicket.toJSON());
                    return supportTicket.save({
                        deleted: true,
                        archived: false,
                        updatedBy: this.credentials.id
                    }, {patch: true, transacting: t})
                        .then((updatedSupportTicket) => updatedSupportTicket.load(['form', 'statusType', 'assignedUser', 'updatedByUser']))
                        .tap ((model) => this.addHistory(originalTicket, model, t, false));
                })
            ).then((supportTicket) => this.getTicketById(id));
        }
        markArchived (id) {
            return this.Bookshelf.transaction(t =>
                new this.SupportTicket().where({id, tenantId: this.tenantId})
                .fetch({withRelated: ['statusType', 'assignedUser', 'updatedByUser']})  //all needed by history!!!
                .then(this.checkExists("This ticket does not exist"))
                .then(supportTicket => {
                    let originalTicket = _.cloneDeep(supportTicket.toJSON());
                    return supportTicket.save({
                        deleted: false,
                        archived: true,
                        updatedBy: this.credentials.id
                    }, {patch: true, transacting: t})
                        .then((updatedSupportTicket) => updatedSupportTicket.load(['form', 'statusType', 'assignedUser', 'updatedByUser']))
                        .tap ((model) => this.addHistory(originalTicket, model, t, false));
                })
            );
        }
        getTicketById (ticketId, requestType) {
            let User = this.getModel('User'), self = this,
                queryType = requestType || 'comments';  //details - NOT USED ANYMORE, USE COMMENTS AS DEFAULT!, notes, comments, history

            let related = ['statusType', 'user', 'assignedUser', 'updatedByUser', 'form', 'comments', 'history', 'history.user', 'history.updatedByUser'];
            // there is a 'view' and a 'manage' so we need to check for both:
            if (this.permissions.allowed("CanViewNotes", this.tenantId)) {
                related.push('notes');
                related.push('notes.user');
            }

            switch (queryType) {
                case 'details':
                    //related = related.concat(['attachments', 'attachments.user']);
                    related = related.concat([
                        {'attachments': (qb) => qb.where('deleted', false)},
                        'attachments.user'
                    ]);
                    break;
                case 'comments':
                    related = related.concat([
                            {'attachments': (qb) => qb.where('deleted', false)},
                            'attachments.user'
                        ]);
                    related.push('comments.user');
                    break;
                case 'notes':
                    // there is a 'view' and a 'manage' so we need to check for both:
                    if (this.permissions.allowed("CanViewNotes", this.tenantId)) {
                        related.push('notes.user');
                    }
                    break;
                case 'all':
                    related = related.concat([
                        {'attachments': (qb)  => qb.where('deleted', false)},
                        'attachments.user',
                        'comments.user'
                    ]);
                    if (this.permissions.allowed("CanViewNotes", this.tenantId)) {
                        related.push('notes.user');
                    }
                    break;
            }

            return new this.SupportTicket({'id': ticketId})
                .where({'supportTickets.tenantId': this.tenantId})
                .fetch({withRelated: related})
                .tap (supportTicket => {
                        return this.permissions.validate(
                            this.credentials.id === supportTicket.related('user').id ||
                            this.credentials.id === supportTicket.related('assignedUser').id ||
                            this.permissions.allowed("CanManageTickets", this.tenantId)
                        );
                    }
                )
                .then(supportTicket => supportTicket.sanitizeMetadata(this.permissions.allowed("CanManageTickets", this.tenantId)))
                .then(supportTicket => supportTicket.sanitizeHistory(this.permissions.allowed("CanManageTickets", this.tenantId)));
        }
        query (queryString) {
            // To do both metadata and notes/comments, we will have to implement a fulltext search service, such as lucene.
            // while postgres jsonb is incredibly awesome, I'm having trouble getting it to work alongside group by for some reason.
            // alternately, we could group notes/comments before doing the great join of darkness, which theoretically should work.
            let $$ = this.knex.raw;

            let replacements = {
                id: 'supportTickets.id',
                createdBy: 'supportTickets.createdBy',
                created_at: 'supportTickets.created_at',
                updated_at: 'supportTickets.updated_at',
                createdUserName: 'createdUser.name',
                assignedUserName: 'assignedUser.name',
                statusOrder: 'formStatus.statusOrder',
                statusName: 'status.name',
                deleted: 'supportTickets.deleted',
                archived: 'supportTickets.archived',
                notes: 'notes.content'
            };

            let queryBuilder = new QueryBuilder(replacements,  this.knex.raw);

            let selectFields = ['supportTickets.id',
                //'supportTickets.subject',
                'supportTickets.createdBy',
                'supportTickets.updated_at',
                'supportTickets.created_at',
                'supportTickets.assignedTo',
                'supportTickets.tenantId',
                'supportTickets.deleted',
                'supportTickets.archived',
                'supportTickets.statusType',
                'supportTickets.formId',
                'supportTickets.metadata',
                'createdUser.name as createdUserName',
                'assignedUser.name as assignedUserName',
                'formStatus.statusOrder',
                this.knex.raw('count(*) OVER() AS total')
            ];

            //get ticket id's of any criteria that matches
            let innerQuery = this.knex("supportTickets")
                .leftJoin('users as createdUser', 'createdUser.id', 'supportTickets.createdBy')
                .leftJoin('users as assignedUser', 'assignedUser.id', 'supportTickets.assignedTo')
                .leftJoin('statusTypes as status', 'status.id', 'supportTickets.statusType')
                .leftJoin(
                    this.knex.select('forms.id',  this.knex.raw('CAST(elements->>\'id\' AS integer) as "mid"'),  this.knex.raw('row_number() OVER () AS "statusOrder"'))
                        .from( this.knex.raw('forms, json_array_elements(forms."statusTypes"::json->\'statusIds\') elements'))
                        .where('forms.tenant_id', this.tenantId).as('formStatus'),
                    qb => qb.on('formStatus.id', 'supportTickets.formId')
                        .andOn('formStatus.mid', 'supportTickets.statusType')
                )
                .where({'supportTickets.tenantId': this.tenantId})
                .select(selectFields);

            if (!this.permissions.allowed("CanManageTickets", this.tenantId)) {
                innerQuery = innerQuery.andWhere(qb =>
                    qb.where({'supportTickets.createdBy': this.credentials.id})
                        .orWhere({'supportTickets.assignedTo': this.credentials.id}));
            }

            return queryBuilder.createQuery(innerQuery, queryString)
                .orderBy('supportTickets.updated_at', 'desc');

        }

        paginatedQuery(query) {
            let replacements = {
                id: 'supportTickets.id',
                createdBy: 'supportTickets.createdBy',
                created_at: 'supportTickets.created_at',
                updated_at: 'supportTickets.updated_at',
                createdUserName: 'createdUser.name',
                assignedUserName: 'assignedUser.name',
                statusOrder: 'formStatus.statusOrder',
                statusName: 'status.name',
                deleted: 'supportTickets.deleted',
                archived: 'supportTickets.archived',
                notes: 'notes.content'
            };

            let selectFields = [
                'supportTickets.id',
                'supportTickets.createdBy',
                'supportTickets.updated_at',
                'supportTickets.created_at',
                'supportTickets.assignedTo',
                'supportTickets.tenantId',
                'supportTickets.deleted',
                'supportTickets.archived',
                'supportTickets.statusType',
                'supportTickets.formId',
                'supportTickets.metadata',
                'createdUser.name as createdUserName',
                'assignedUser.name as assignedUserName',
                this.knex.raw('count(*) OVER() AS total')
            ];

            let queryBuilder = new QueryBuilder(replacements, this.knex.raw);

            let innerQuery = this.knex("supportTickets")
                .leftJoin('users as createdUser', 'createdUser.id', 'supportTickets.createdBy')
                .leftJoin('users as assignedUser', 'assignedUser.id', 'supportTickets.assignedTo')
                .leftJoin('statusTypes as status', 'status.id', 'supportTickets.statusType')
                .leftJoin('forms as form', 'form.id', +query.formId)
                .leftJoin(
                    this.knex.select('forms.id', this.knex.raw('CAST(elements->>\'id\' AS integer) as "mid"'), this.knex.raw('row_number() OVER () AS "statusOrder"'))
                        .from(this.knex.raw('forms, json_array_elements(forms."statusTypes"::json->\'statusIds\') elements'))
                        .where('forms.tenant_id', query.tenantId).as('formStatus'),
                    qb => qb.on('formStatus.id', 'supportTickets.formId')
                        .andOn('formStatus.mid', 'supportTickets.statusType')
                )
                .where({
                    'supportTickets.formId': +query.formId,
                    'supportTickets.tenantId': query.tenantId,
                    'supportTickets.archived': query.archived.toString(),
                    'supportTickets.deleted': query.deleted.toString(),
                })

            if (query.searchValue) {
                const fieldsToSearch = [
                    '"supportTickets".id',
                    '"supportTickets"."createdBy"',
                    '"createdUser".name',
                    `"supportTickets".metadata ->> 'controls'`,
                ]

                query.searchValue = query.searchValue.toLowerCase();

                const splitSearchValue = query.searchValue.split(' ');

                splitSearchValue.forEach(searchValue => {
                    innerQuery = innerQuery.andWhere(q => {
                        fieldsToSearch.forEach(field => {
                            q = q.orWhereRaw(`lower(cast(${field} as text)) like '%${searchValue}%'`);
                        })
                    })
                }

                )
            }

            if (query.statusId && query.statusId > 0) {
                innerQuery = innerQuery.where({ 'supportTickets.statusType': +query.statusId })
            }

            innerQuery = innerQuery.select(selectFields);
            if (!this.permissions.allowed("CanManageTickets", query.tenantId)) {
                innerQuery = innerQuery.andWhere(qb =>
                    qb.where({ 'supportTickets.createdBy': this.credentials.id })
                    .orWhere({ 'supportTickets.assignedTo': this.credentials.id }));
            }

            if (query.toggleSetting === 'My') {
                innerQuery = innerQuery.andWhere(qb =>
                    qb.where({ 'supportTickets.createdBy': this.credentials.id })
                        .orWhere({ 'supportTickets.assignedTo': this.credentials.id }));
            }


            const sortDirection = !!query.sortDirection ? query.sortDirection : 'asc'

            if (query.headerId) {
                switch (query.headerId) {
                    case 'id':
                        innerQuery = innerQuery.orderBy('supportTickets.id', sortDirection);
                        break
                    case 'created_at':
                        innerQuery = innerQuery.orderBy('supportTickets.created_at', sortDirection);
                        break
                    case 'ticketAge':
                        innerQuery = innerQuery.orderBy('supportTickets.created_at', sortDirection === 'asc' ? 'desc' : 'asc');
                        break
                    case 'createdUserName':
                        innerQuery = innerQuery.orderByRaw(`"createdUserName" ${sortDirection}`);
                        break
                    case 'status':
                        innerQuery = innerQuery.orderBy('supportTickets.statusType', sortDirection);
                        break
                    case 'updated_at':
                        innerQuery = innerQuery.orderBy('supportTickets.updated_at', sortDirection);
                        break
                    case 'assignedUserName':
                        innerQuery = innerQuery.orderByRaw(`"assignedUserName" ${sortDirection}`);
                        break
                    default:
                        innerQuery = innerQuery.orderByRaw(`metadata -> 'controls' ->> '${query.headerId}' ${sortDirection}`);
                }
            } else {
                innerQuery = innerQuery.orderBy('supportTickets.updated_at', 'desc');
            }

            innerQuery = innerQuery.limit(+query.pageLimit).offset(+query.pageLimit * (+query.page - 1));
            return queryBuilder.createQuery(innerQuery, query)
                // .orderBy(orderBy, direction);
        }

        quantities(query) {
            // Returns each ticket with form and status ids, names, etc., for counts in sidebar. 
            // !! Important to note: this could be made smaller by using GROUP BY to return 
            // a list of forms, their status types, and the quantities of each, probably. 
            return this.knex('supportTickets')
                .join('forms', 'supportTickets.formId', 'forms.id')
                .join('statusTypes', 'supportTickets.statusType', 'statusTypes.id')
                .select(
                    'supportTickets.id',
                    'supportTickets.tenantId',
                    'supportTickets.archived',
                    'supportTickets.deleted',
                    'supportTickets.assignedTo',
                    'supportTickets.createdBy',
                    'supportTickets.assignedTo',
                    {
                        supportTicketStatusType: 'supportTickets.statusType',
                        supportTicketFormId: 'supportTickets.formId',
                        formId: 'forms.id',
                        formName: 'forms.name',
                        formTenantId: 'forms.tenant_id',
                        statusTypeTenantId: 'statusTypes.tenantId',
                        statusTypeId: 'statusTypes.id',
                        statusTypeName: 'statusTypes.name'
                    },
                )
                .where({
                    'supportTickets.tenantId': query.tenantId,
                })
        }

        csv(query) {
            let replacements = {
                id: 'supportTickets.id',
                createdBy: 'supportTickets.createdBy',
                created_at: 'supportTickets.created_at',
                updated_at: 'supportTickets.updated_at',
                createdUserName: 'createdUser.name',
                assignedUserName: 'assignedUser.name',
                statusOrder: 'formStatus.statusOrder',
                statusName: 'status.name',
                deleted: 'supportTickets.deleted',
                archived: 'supportTickets.archived',
                notes: 'notes.content'
            };

            let selectFields = [
                'supportTickets.id',
                'supportTickets.createdBy',
                'supportTickets.updated_at',
                'supportTickets.created_at',
                'supportTickets.assignedTo',
                'supportTickets.tenantId',
                'supportTickets.deleted',
                'supportTickets.archived',
                'supportTickets.statusType',
                'supportTickets.formId',
                'supportTickets.metadata',
                'status.name as status',
                'createdUser.name as createdUserName',
                'assignedUser.name as assignedUserName',
                this.knex.raw('count(*) OVER() AS total')
            ];

            let queryBuilder = new QueryBuilder(replacements, this.knex.raw);

            let innerQuery = this.knex("supportTickets")
                .leftJoin('users as createdUser', 'createdUser.id', 'supportTickets.createdBy')
                .leftJoin('users as assignedUser', 'assignedUser.id', 'supportTickets.assignedTo')
                .leftJoin('statusTypes as status', 'status.id', 'supportTickets.statusType')
                .leftJoin('forms as form', 'form.id', +query.formId)
                .leftJoin(
                    this.knex.select('forms.id', this.knex.raw('CAST(elements->>\'id\' AS integer) as "mid"'), this.knex.raw('row_number() OVER () AS "statusOrder"'))
                        .from(this.knex.raw('forms, json_array_elements(forms."statusTypes"::json->\'statusIds\') elements'))
                        .where('forms.tenant_id', query.tenantId).as('formStatus'),
                    qb => qb.on('formStatus.id', 'supportTickets.formId')
                        .andOn('formStatus.mid', 'supportTickets.statusType')
                )
                .where({
                    'supportTickets.formId': +query.formId,
                    'supportTickets.tenantId': query.tenantId,
                    'supportTickets.archived': query.archived.toString(),
                    'supportTickets.deleted': query.deleted.toString(),
                })

            if (query.searchValue) {
                const fieldsToSearch = [
                    '"supportTickets".id',
                    '"supportTickets"."createdBy"',
                    '"createdUser".name',
                    `"supportTickets".metadata ->> 'controls'`,
                ]

                query.searchValue = query.searchValue.toLowerCase();

                const splitSearchValue = query.searchValue.split(' ');

                splitSearchValue.forEach(searchValue => {
                    innerQuery = innerQuery.andWhere(q => {
                        fieldsToSearch.forEach(field => {
                            q = q.orWhereRaw(`lower(cast(${field} as text)) like '%${searchValue}%'`);
                        })
                    })
                }

                )
            }

            if (query.statusId && query.statusId > 0) {
                innerQuery = innerQuery.where({ 'supportTickets.statusType': +query.statusId })
            }

            innerQuery = innerQuery.select(selectFields);
            if (!this.permissions.allowed("CanManageTickets", query.tenantId)) {
                innerQuery = innerQuery.andWhere(qb =>
                    qb.where({ 'supportTickets.createdBy': this.credentials.id })
                        .orWhere({ 'supportTickets.assignedTo': this.credentials.id }));
            }

            if (query.toggleSetting === 'My') {
                innerQuery = innerQuery.andWhere(qb =>
                    qb.where({ 'supportTickets.createdBy': this.credentials.id })
                        .orWhere({ 'supportTickets.assignedTo': this.credentials.id }));
            }


            const sortDirection = !!query.sortDirection ? query.sortDirection : 'asc'

            if (query.headerId) {
                switch (query.headerId) {
                    case 'id':
                        innerQuery = innerQuery.orderBy('supportTickets.id', sortDirection);
                        break
                    case 'created_at':
                        innerQuery = innerQuery.orderBy('supportTickets.created_at', sortDirection);
                        break
                    case 'ticketAge':
                        innerQuery = innerQuery.orderBy('supportTickets.created_at', sortDirection === 'asc' ? 'desc' : 'asc');
                        break
                    case 'createdUserName':
                        innerQuery = innerQuery.orderByRaw(`"createdUserName" ${sortDirection}`);
                        break
                    case 'status':
                        innerQuery = innerQuery.orderBy('supportTickets.statusType', sortDirection);
                        break
                    case 'updated_at':
                        innerQuery = innerQuery.orderBy('supportTickets.updated_at', sortDirection);
                        break
                    case 'assignedUserName':
                        innerQuery = innerQuery.orderByRaw(`"assignedUserName" ${sortDirection}`);
                        break
                    default:
                        innerQuery = innerQuery.orderByRaw(`metadata -> 'controls' ->> '${query.headerId}' ${sortDirection}`);
                }
            } else {
                innerQuery = innerQuery.orderBy('supportTickets.updated_at', sortDirection);
            }
            return queryBuilder.createQuery(innerQuery, query)
        }

        forms(tenantId, formId) {
            return this.knex('forms').where({ id: formId, tenant_id: tenantId })
        }

        filterCols(tenantId, formId) {
            let isAdmin = false;
            return this.knex('forms').where({ id: formId, tenant_id: tenantId }).first().select(['settings', 'ticketTemplate'])
            .then(relatedForm => {
                let template = _.map(_.get(relatedForm, 'ticketTemplate.controls'), _.property('name'));
                let defaults = _.map(_.filter(_.get(relatedForm, 'settings.defaultGridColumns'), { 'selected' : true }), _.property('name'));
                let displayCols = _.intersection(defaults, template);
                return displayCols;
            });
        }

        statuses(tenantId, formId) {
            return this.knex('statusTypes').where({ "tenantId": tenantId }).select(['id', 'name'])
        }

        insertTicket (model, emailNotification) {
            let metadata = model.metadata;
            delete model.metadata;
            model.tenantId = this.tenantId;
            model.deleted = false;
            model.archived = false;

            return this.Bookshelf.transaction(t =>
                new this.SupportTicket(model)
                    .setMetadata(metadata, this.permissions.allowed("CanManageTickets", this.tenantId))
                    .catch(err => Promise.reject(Boom.badRequest(err)))
                    .then(ticket => ticket.setAutoAssignedUser())
                    .then(ticket => ticket.save(null, {transacting: t}))
                    .then(ticket => ticket.load(['statusType', 'user']))
                    .then (ticket => this.addHistory(ticket, ticket, t, true))
                    .then(ticket => {
                        if (model.created_at && this.permissions.allowed("CanManageTickets", this.tenantId)){
                            return ticket.save({created_at: model.created_at}, {
                                method: 'update',
                                patch: true,
                                transacting: t});
                        } else {
                            return ticket; }})
                )
                .then(supportTicket => {
                    let ticketId = supportTicket.get('supportTicketId');
                    return new this.SupportTicket({id: ticketId}).fetch({withRelated: ['form', 'statusType', 'user', 'assignedUser', 'updatedByUser', 'comments', 'comments.user', 'attachments']})
                    .tap (ticket => { 
                        this.notify.ticketAdded(ticket.toJSON(), emailNotification); })
                    }
                )
                .then(supportTicket => {
                    if (this.permissions.allowed('CanViewNotes', this.tenantId)) {
                        return supportTicket.load(['notes', 'notes.user']);
                    } else {
                        return supportTicket;
                    }
                })
                .then(supportTicket => supportTicket.sanitizeMetadata(this.permissions.allowed("CanManageTickets", this.tenantId)));

        }
        insertComment (comment, emailNotification) {
            let Comment = this.getModel('Comment');
            return new Comment(comment)
                .save()
                .then(comment => comment.load('user'))
                .tap (result =>
                    //configure to send an email
                    new this.SupportTicket({id: comment.supportTicketId})
                        .fetch({withRelated: ['form', 'user', 'assignedUser']})
                        .then(supportTicket => {
                            this.notify.ticketComment(supportTicket.toJSON(), emailNotification);

                            return supportTicket.save({"updatedBy": comment.createdBy, "updated_at": new Date()});
                        }));
        }
        insertNote (note, emailNotification) {
            let Note = this.getModel('Note');
            note.supportTicketId = note.supportTicketId;
            let notifyUsers = [];
            if (note.notifyUsers){
                notifyUsers = note.notifyUsers;
                note.notifyUsers = note.notifyUsers.join(',');
            }

            return new Note(note).save()
                .then(note => note.load('user'))
                .tap (result =>
                //configure to send an email
                new this.SupportTicket({id: note.supportTicketId})
                    .fetch({withRelated: ['form', 'user', 'assignedUser']})
                    .then(supportTicket => {
                         if(notifyUsers){
                             new this.User().where('id', 'in', notifyUsers).fetchAll()
                                 .then(users => this.notify.ticketNote(supportTicket.toJSON(), emailNotification, users.toJSON()));
                         }else{
                             this.notify.ticketNote(supportTicket.toJSON(), emailNotification);
                         }
                    }));
            // UPDATED 7/15/15 - we are not going to update the ticket updatedby and updatedat on a note
            // this data would be reflected in the UI and we don't think it's ok to show users this information.
        }
        addHistory (originalSupportTicket, supportTicket, transaction, isNew) {
            let difference = [],
                blackListItems = ['statusType.id',
                    'statusType.workflowActionName',
                    'statusType.color',
                    'statusType.updated_at',
                    'statusType.created_at',
                    'statusType.createdBy',
                    'updated_at',
                    'created_at',
                    'createdBy',
                    'form',
                    'formId',
                    'updatedBy',
                    'updatedByUser',
                    'metadata',
                    'controls'],
                reason = "";

            if (isNew) {
                reason = "Ticket created";
            }
            else {
                reason = "Ticket updated";

                let supportTicketToJson = _.cloneDeep(supportTicket.toJSON());
                let orgST = (JSON.parse(JSON.stringify(originalSupportTicket)));

                observableDiff(originalSupportTicket, supportTicketToJson, function (d) {
                    // Apply all changes except these:
                    //console.log(d.path);
                    let path = d.path.join('.');
                    if (!_.includes(blackListItems, path)) {
                        // console.log(d.path.join('.'));
                        applyChange(originalSupportTicket, supportTicketToJson, d);

                        if(path.startsWith('metadata.controls')){
                            let metadataFieldName = d.path[2];
                            if(supportTicketToJson.form){
                                let ticketTemplate = supportTicketToJson.form.ticketTemplate;
                                if(ticketTemplate){
                                    let control = _.find(ticketTemplate.controls, {name: metadataFieldName});
                                    if (control.type === "checkboxlist") {
                                        let orgControl = orgST.metadata.controls;
                                        let supportTicketControl = supportTicketToJson.metadata.controls;

                                        if (orgControl[metadataFieldName] && supportTicketControl[metadataFieldName]) {
                                            //only add the one record of change
                                            if (!_.some(difference, 'name', metadataFieldName)) {
                                                difference.push({
                                                    "lhs": orgControl[metadataFieldName].join(','),
                                                    "rhs": supportTicketControl[metadataFieldName].join(','),
                                                    "kind": "E",
                                                    "name": metadataFieldName,
                                                    "path": ['metadata', 'controls', metadataFieldName],
                                                    "control": control
                                                });
                                            }
                                        } else {
                                            if (supportTicketControl[metadataFieldName]) {
                                                //only add the one record of change
                                                if (!_.some(difference, 'name', metadataFieldName)) {
                                                    difference.push({
                                                        "lhs": null,
                                                        "rhs": supportTicketControl[metadataFieldName].join(','),
                                                        "kind": "E",
                                                        "name": metadataFieldName,
                                                        "path": ['metadata', 'controls', metadataFieldName],
                                                        "control": control
                                                    });
                                                }
                                            }
                                        }
                                    }else if(control.type === "timepicker"){
                                        let lhs = d.lhs !== undefined ? d.lhs.split('T') : null;
                                        let rhs = d.rhs.split('T');
                                        if(!lhs || (lhs && lhs[1] !== rhs[1])){
                                            d.control = control;
                                            if(!(path.startsWith("assignedUser") || path.startsWith('updatedByUser'))){
                                                difference.push(d);
                                            }
                                        }
                                    }else {
                                        d.control = control;
                                        if(!(path.startsWith("assignedUser") || path.startsWith('updatedByUser'))){
                                            //only add the one record of change
                                            if (!_.some(difference, 'name', metadataFieldName)) {
                                                difference.push(d);
                                            }
                                        }
                                    }
                                }
                            }
                        }else {
                            if(!(path.startsWith("assignedUser") || path.startsWith('updatedByUser'))){
                                if(path === 'assignedTo'){
                                    let newDiff = {
                                        "lhs": null,
                                        "rhs": null,
                                        "kind": d.kind,
                                        "name": d.name,
                                        "path": d.path
                                    };
                                    //store the name instead of the idea
                                    if(d.lhs && orgST.assignedUser && orgST.assignedUser.name) {
                                        newDiff.lhs = orgST.assignedUser.name;
                                    }
                                    if(supportTicketToJson.assignedUser && supportTicketToJson.assignedUser.name) {
                                        newDiff.rhs = supportTicketToJson.assignedUser.name;
                                    }
                                    difference.push(newDiff);
                                }else {
                                    difference.push(d);
                                }
                            }
                        }

                    }
                });
            }

            if (isNew || difference.length > 0) {
                // console.log('adding history record');
                return new this.SupportTicketHistory({
                    supportTicketId: supportTicket.get('id'),
                    formId: supportTicket.get('formId'),
                    //subject: supportTicket.get('subject'),
                    //description: supportTicket.get('description'),
                    statusName: supportTicket.related('statusType').get('name'),
                    createdBy: supportTicket.get('createdBy'),
                    updatedBy: supportTicket.get('updatedBy'),
                    tenantId: supportTicket.get('tenantId'),
                    assignedTo: supportTicket.get('assignedTo'),
                    deleted: supportTicket.get('deleted'),
                    archived: supportTicket.get('deleted'),
                    metadata: supportTicket.get('metadata'),
                    reason: reason,
                    changes: {diff: difference}
                }).save(null, {transacting: transaction});
            } else {
                //no differences, but still need to return we are done...
                return Promise.resolve();
            }
        }
        addAdditionalHistory (supportTicketId, transaction, reason, difference) {
            /* used by attachments, notes, comments */

            return new this.SupportTicket({id: supportTicketId}).fetch().then((supportTicket) =>
                new this.SupportTicketHistory ({
                    supportTicketId: supportTicket.get('id'),
                    formId: supportTicket.get('formId'),
                    statusName: supportTicket.related('statusType').get('name'),
                    createdBy: supportTicket.get('createdBy'),
                    updatedBy: this.credentials.id, //supportTicket.get('updatedBy'), should be logged in user
                    tenantId: supportTicket.get('tenantId'),
                    assignedTo: supportTicket.get('assignedTo'),
                    deleted: supportTicket.get('deleted'),
                    archived: supportTicket.get('archived'),
                    metadata: supportTicket.get('metadata'),
                    reason: reason,
                    changes: {diff: difference}
                }).save(null, {transaction: transaction})
            );
        }
    };
