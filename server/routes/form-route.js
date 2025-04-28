(function() {
    "use strict";
    let Boom = require('boom');
    //let auth = require("../services/auth");
    let Joi = require("joi");
    let FormService = require("../services/form-service");
    let PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            console.log('lookup', err.stack);
            reply(Boom.wrap(err));
        };
    };

    let socketResponse = function (request, reply,  key, val){
        return function (result) {
            let io = request.server.plugins['hapi-io'].io;
            io.sockets.in('/tenant_' + request.params.tenantId).emit(key, val);

            reply(result);
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/form/{id}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
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
                new FormService(request).getForm(request.params.id).then(reply, reject(reply));
            }
        },
        {
            method: "GET",
            path: "/api/forms/icons",
            config: {
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                new FormService(request).getFormIcons().then(reply, reject(reply));
            }
        },
        {
            method: "GET",
            path: "/api/{tenantId}/form/{formId}/tickets",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required(),
                        formId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                new FormService(request).getTickets(request.params.formId).then(reply, reject(reply));
            }
        },
        {
            method: "DELETE",
            path: "/api/{tenantId}/form/{id}",
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
                new FormService(request).deleteForm(request.params.id)
                    .then(socketResponse(request, reply, 'lookup-changed', request.params.tenantId), reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/form/{id}",
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

                request.payload.id = request.params.id;
                new FormService(request).updateForm(request.payload)
                    .then(socketResponse(request, reply, 'lookup-changed', request.params.tenantId), reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/form",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    },
                    payload: {
                        name: Joi.string().required(),
                        color: Joi.string().required(),
                        roles: Joi.object(),
                        ticketTemplate: Joi.object(),
                        settings: Joi.object().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new FormService(request).createForm(request.payload)
                    .then(socketResponse(request, reply, 'lookup-changed', request.params.tenantId), reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/form-order",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    },
                    payload: {
                        formIds: Joi.array().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new FormService(request).saveFormOrder(request.payload.formIds)
                    .then(socketResponse(request, reply, 'lookup-changed', request.params.tenantId), reject(reply));
            }
        }
    ];
})();
