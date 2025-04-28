(function() {
    "use strict";
    let Boom = require('boom');
    //let auth = require("../services/auth");
    let Joi = require("joi");
    let StatusService = require("../services/status-service");
    let PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            console.log('status', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/status",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages',request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new StatusService(request).getAllStatus().then(reply, reject(reply));
            }
        },
        {
            method: "DELETE",
            path: "/api/{tenantId}/status/{id}",
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
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new StatusService(request).deleteStatus(request.params.id, request.query.newStatus).then(response => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);


                    reply(response);
                }, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/status/{statusId}/bulkMove",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required(),
                        statusId: Joi.number().required()
                    },
                    payload:{
                        formId: Joi.number().required(),
                        newStatus: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new StatusService(request).moveTickets(request.params.tenantId, request.payload.formId, request.params.statusId, request.payload.newStatus).then(response => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);


                    reply(response);
                }, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/status",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new StatusService(request).updateStatus(request.payload).then(response => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);


                    reply(response);
                }, reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/status",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    //payload: {
                    //    name: Joi.string(),
                    //    order: Joi.string().required(),
                    //    isWorkFlow: Joi.string().required(),
                    //    workflowActionName: Joi.string().required()
                    //},
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new StatusService(request).createStatus(request.payload).then(response => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);


                    reply(response);
                }, reject(reply));
            }
        }
    ];
})();
