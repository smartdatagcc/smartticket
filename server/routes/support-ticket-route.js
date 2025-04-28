const { string } = require("joi");

(function () {
    "use strict";

    let Joi = require("joi"),
        Boom = require('boom'),
        _ = require('lodash'),
        moment = require('moment'),
        stringify = require('csv-stringify'),
        SupportTicketService = require("../services/support-ticket-service"),
        PermissionsService = require("../services/permissions-service"),
        UnAuthorizedException = require("../utils/unauthorized-exception"),
        eventService = require('../services/event-service'),
        LookupData = require('../services/lookup-data');

    let reject = function (reply){
        return function (err) {
            console.log('support-ticket', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            //GET ALL SUPPORT TICKETS:
            method: "GET",
            path: "/api/{tenantId}/supporttickets",
            config: {
                auth: 'token',
                plugins: {
                    'hapi-io': {
                        event: 'get-tickets'
                    }
                },
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                request.query.tenantId = request.params.tenantId;
                new SupportTicketService(request).query(request.query).then(reply, reject(reply));
            }
        },
        {
            // GET SUPPORT TICKETS BY TENANTID + FORMID + MORE ACCORDING TO PARAMS
            method: "GET",
            path: "/api/{tenantId}/supportTicketsPaginated",
            config: {
                auth: 'token',
                plugins: {
                    'hapi-io': {
                        event: 'get-tickets'
                    }
                },
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                request.query.tenantId = request.params.tenantId;
                request.params.formId = +request.params.formId;
                new SupportTicketService(request).paginatedQuery(request.query)
                    .then(reply, reject(reply));
            }
        },
        {
            // GET FILTERED SUPPORT TICKETS IN CSV
            method: "GET",
            path: "/api/{tenantId}/supportTicketsCSV",
            config: {
                auth: 'token',
                plugins: {
                    'hapi-io': {
                        event: 'get-tickets'
                    }
                },
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                request.query.tenantId = request.params.tenantId;
                request.params.formId = +request.params.formId;
                let returnCSV = [];
                const columnHeaders = ['id', ...JSON.parse(request.query.columnHeaders)];

                return new SupportTicketService(request).csv(request.query)
                    .then(data => {
                        return new SupportTicketService(request).forms(request.query.tenantId, +request.query.formId)
                            .then(formData => {
                                const form = formData[0];

                                // Loop through headers and find its 'label' if it exists in the ticketTemplate of the form:
                                const headerLabels = {};
                                columnHeaders.forEach(header => {
                                    if (header === 'id') {
                                        headerLabels[header] = 'Ticket Id';
                                    } else if (form.settings.defaultGridColumns.find(column => column.name === header)) {
                                        headerLabels[header] = form.settings.defaultGridColumns.find(column => column.name === header).label;
                                    } else {
                                        headerLabels[header] = header;
                                    }
                                })

                                return data.forEach(row => {
                                    let returnRowObject = {};
                                    columnHeaders.forEach(header => {
                                        const headerLabel = headerLabels[header];
                                        if (header === 'ticketAge') {
                                            const timeDifference = Math.floor((new Date() - new Date(row.created_at)) / (1000 * 3600 * 24));
                                            !!timeDifference ?
                                                returnRowObject[headerLabel] = timeDifference.toString() + ' days'
                                                : returnRowObject[headerLabel] = ''
                                        } else if (header === 'toggle') {
                                            !!row.metadata.controls.toggle ? returnRowObject[headerLabel] = 'Yes' : returnRowObject[headerLabel] = 'No';
                                        } else if (row[header]) {
                                            returnRowObject[headerLabel] = row[header].toString();
                                        } else if (row.metadata.controls[header]) {
                                            returnRowObject[headerLabel] = row.metadata.controls[header].toString();
                                        } else {
                                            const formValue = form.ticketTemplate.controls.find(control => control.name === header)
                                            if (formValue && formValue.value) {
                                                returnRowObject[headerLabel] = formValue.value;
                                            } else {
                                                returnRowObject[headerLabel] = "";
                                            }
                                        }
                                    })
                                    returnCSV.push(returnRowObject);
                                })
                            })
                    })
                    .then(data => {
                        return reply(stringify(returnCSV, { header: true }))
                        .header('Content-Type', 'text/csv')
                        .header('Content-Encoding', 'utf-8')
                        .header('Content-Disposition', 'attachment; filename=tickets.csv;')
                            , reject(reply)
                    }
                    );
            }
        },
        {
            //GET ALL SUPPORT TICKET STATUS AND FORM QUANTITIES:
            method: "GET",
            path: "/api/{tenantId}/quantities",
            config: {
                auth: 'token',
                plugins: {
                    'hapi-io': {
                        event: 'get-tickets'
                    }
                },
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                request.query.tenantId = request.params.tenantId;
                new SupportTicketService(request).quantities(request.query)
                    .then(reply, reject(reply));
            }
        },
        {
            //GET ALL SUPPORT TICKETS AS CSV:
            method: "GET",
            path: "/api/{tenantId}/supporttickets/csv",
            config: {
                auth: 'token',
                plugins: {
                    'hapi-io': {
                        event: 'get-tickets'
                    }
                },
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                var query = _.omit(request.query, ['$skip', '$top']);
                query.tenantId = request.params.tenantId;
                new SupportTicketService(request).query(query)
                .tap(() => new SupportTicketService(request).filterCols().then(c => cols = c))
                .then(data => {
                    reply(stringify(data.map(v => {
                        let templateCols = _.zipObject(cols);
                        let filtered = _.reduce(v.metadata.controls, (result, value, key) => cols.indexOf(key) > -1 ? 
                        _.set(result, key, value) : result, templateCols);
                        return _.assign(
                            filtered,
                            {
                                id: v.id,
                                updated_at: moment(v.updated_at).toISOString(),
                                created_at: moment(v.created_at).toISOString(),
                                assignedTo: v.assignedTo,
                                archived: v.archived,
                                createdUserName: v.createdUserName,
                                assignedUserName: v.assignedUserName,
                            });
                    }), { header: true }
                    )).header('Content-disposition', 'attachment; filename=tickets.csv');
                }, reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/supporttickets",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        tenantId: Joi.number().required(),
                        formId: Joi.number().required(),
                        metadata: Joi.object(),
                        assignedTo: Joi.number()
                    },
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                return new LookupData(request).getLookupData(request.params.tenantId).then((lookup) => {
                    let form = _.find(lookup.tenant.toJSON().forms, {id: parseInt(request.payload.formId, 10)});
                    request.payload.statusType = _.result(form.statusTypes.statusIds[0], "id");
                    request.payload.createdBy = request.auth.credentials.id;
                    request.payload.updatedBy = request.auth.credentials.id;

                    return new SupportTicketService(request).insertTicket(request.payload, lookup.tenant.get('tenantSettings').settings.emailNotification, lookup.tenant.get('name'))
                        .then((result) => {
                            let io = request.server.plugins['hapi-io'].io;
                            io.sockets.in('/tenant_' + request.params.tenantId).emit('ticket-changed', result.get('id'));
                            reply(result);
                        }, reject(reply));
                });
            }
        },
        {
            //Delete Support Ticket
            method: "DELETE",
            path: "/api/{tenantId}/supporttickets/{id}",
            config: {
                notes: 'Requires CanManageTickets permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new SupportTicketService(request).markDeleted(request.params.id).then((result) => {
                    let io = request.server.plugins['hapi-io'].io;
                    console.log('ticket-deleted && ticket-changed ' + request.params.id);
                    io.sockets.in('/ticket_' + request.params.id).emit('ticket-deleted', result);
                    io.sockets.in('/tenant_' + request.params.tenantId).emit('ticket-changed', request.params.id);
                    reply(result);
                }, reject(reply));
            }
        },
        {
            //archive Support Ticket
            method: "PUT",
            path: "/api/{tenantId}/supporttickets/{id}/archive",
            config: {
                notes: 'Requires CanManageTickets permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new SupportTicketService(request).markArchived(request.params.id).then((result) => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/ticket_' + request.params.id).emit('ticket-updated', request.params.id);
                    io.sockets.in('/tenant_' + request.params.tenantId).emit('ticket-changed', request.params.id);

                    //////console.log('ticket-deleted && ticket-changed');
                    reply(result);
                }, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/supporttickets/{id}/undelete",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                //only an Admin can delete/undelete a ticket:
                if(request.payload.deleted && !new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                //Checking Permission in Service
                request.payload.id = request.params.id;
                new SupportTicketService(request).undelete(request.payload.id).then((ticket) => {
                    let io = request.server.plugins['hapi-io'].io;

                    io.sockets.in('/ticket_' + ticket.get('id')).emit('ticket-updated', ticket.get('id'));
                    io.sockets.in('/tenant_' + ticket.get('tenantId')).emit('ticket-changed', ticket.get('id'));

                    //this just causes two messages on UI - we'll just collapse into 'ticket updated'
                    //we'll only use this when the status is updated directly - see above...
                    //if(ticket.get('statusHasChanged')){
                    //    io.sockets.in('/ticket_' + ticket.get('id')).emit('ticket-status-updated', ticket.get('id'));
                    //}

                    reply(ticket);
                }, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/supporttickets/{id}",
            config: {
                notes: 'Requires CanManageTickets permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        tenantId: Joi.number().allow(null),
                        statusType: Joi.number().required(),
                        metadata: Joi.object().required(),
                        assignedTo: Joi.number().allow(null),
                        id: Joi.number().required(),
                        archived: Joi.bool().allow(null),
                        deleted: Joi.bool().allow(null),
                        updated_at: Joi.string().allow(null)
                    },
                    params:{
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                //I guess this changed,it was only an admin, but now I see spec says anyone who can manage ticket...
                if((request.payload.deleted && request.payload.deleted === true) && !new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions to delete ticket'));
                }
                //only a support person or greater can archive a ticket:
                if((request.payload.archived && request.payload.archived === true) && !new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions to archive ticket'));
                }
                //if the can't edit tickets they can't be updated one...
                if(!new PermissionsService(request.auth.credentials).allowed('CanEditTickets', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions to edit ticket'));
                }
                //Checking Permission in Service
                request.payload.id = request.params.id;
                new SupportTicketService(request).update(request.payload).then((ticket) => {
                    let io = request.server.plugins['hapi-io'].io;

                    io.sockets.in('/ticket_' + ticket.get('id')).emit('ticket-updated', ticket.get('id'));
                    io.sockets.in('/tenant_' + ticket.get('tenantId')).emit('ticket-changed', ticket.get('id'));

                    //this just causes two messages on UI - we'll just collapse into 'ticket updated'
                    //we'll only use this when the status is updated directly - see above...
                    //if(ticket.get('statusHasChanged')){
                    //    io.sockets.in('/ticket_' + ticket.get('id')).emit('ticket-status-updated', ticket.get('id'));
                    //}

                    reply(ticket);
                }, reject(reply));
            }
        },
        {
            //GET SUPPORT TICKET BY ID:
            method: "GET",
            path: "/api/{tenantId}/supporttickets/{id}/{type?}",
            config: {
                notes: 'Requires CanManageTickets permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required(),
                        id: Joi.number().required(),
                        type: Joi.string().allow(null)
                    }
                }
            },
            handler: (request, reply) => {
                //Checking Permission in Service
                new SupportTicketService(request).getTicketById(request.params.id, request.params.type)
                    .then((result) => {
                        if (result) {
                            if(result.get('deleted') === true && !new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId)){
                                reject(reply)(Boom.notFound("this ticket no longer exists"));
                            }
                            reply(result);
                        } else {
                            reject(reply)(Boom.notFound("this ticket id does not not exist"));
                        }
                    }, (err) => {
                        if(err && err.name === "UnAuthorizedException"){
                            reject(reply)(Boom.forbidden(err.message, {ticketid: request.params.id}));
                        }else{
                            reject(reply)(err);
                        }
                    });
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/supporttickets/{id}/comment",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        comment: Joi.string().required()
                    },
                    params:{
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {

                return new LookupData(request).getLookupData(request.params.tenantId).then((lookup) => {
                    return new SupportTicketService(request, request.params.tenantId).insertComment({
                        content: request.payload.comment,
                        createdBy: request.auth.credentials.id,
                        supportTicketId: request.params.id,
                        deleted: false
                    }, lookup.tenant.get('tenantSettings').settings.emailNotification, request.auth.credentials);
                }).then((result) => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/ticket_' + request.params.id).emit('comment-added', result);
                    reply(result);
                }, reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/supporttickets/{id}/note",
            config: {
                notes: 'Requires CanEditNotes permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        content: Joi.string().required(),
                        notifyUsers: Joi.array()
                    },
                    params:{
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanEditNotes', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                return new LookupData(request).getLookupData(request.params.tenantId).then(lookup => {
                    new SupportTicketService(request).insertNote({
                        notifyUsers: request.payload.notifyUsers,
                        content: request.payload.content,
                        createdBy: request.auth.credentials.id,
                        supportTicketId: request.params.id,
                        deleted: false
                    }, lookup.tenant.get('tenantSettings').settings.emailNotification).then(note => {
                        let io = request.server.plugins['hapi-io'].io;
                        note.set('tenantId', request.params.tenantId);
                        eventService.publish('add-note', note);
                        reply(note);
                    }, reject(reply));
                });
            }
        }
    ];
})();

