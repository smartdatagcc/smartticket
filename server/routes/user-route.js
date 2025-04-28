(function () {
    "use strict";

    let Joi = require("joi");
    let Boom = require('boom');
    let UserService = require("../services/user-service");
    let PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            console.log('user', err.stack);
            reply(Boom.wrap(err));
        };
    };

    let socketResponse = function (request, reply,  key, val){
        return function (result) {
            let io = request.server.plugins['hapi-io'].io;
            io.sockets.in('/user_' + request.params.id).emit(key, val);

            reply(result);
        };
    };

    module.exports = [
        {
            //admin get list of users
            method: "GET",
            path: "/api/{tenantId}/users",
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
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new UserService(request).getAllUsers().then(reply, reject(reply));
            }
        },
        {
            //admin get list of pending users (email to add sent)
            method: "GET",
            path: "/api/{tenantId}/users/pending",
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
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new UserService(request).getPendingUsers().then(reply, reject(reply));
            }
        },
        {
            //admin - get a user in a tenant
            method: "GET",
            path: "/api/{tenantId}/users/{id}",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        id: Joi.number().required(),
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                //if (!permService.allowed(request, 'CanViewAdminPages')){
                //    return reply(Boom.forbidden('Invalid permissions'));
                //}
                new UserService(request).getUser(request.params.id).then(reply, reject(reply));
            }
        },
        {
            //admin updates the user in a tenant (ie. role)
            method: "PUT",
            path: "/api/{tenantId}/users/{id}/role",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        id: Joi.number().required(),
                        tenantId: Joi.number().required()
                    },
                    payload: {
                        role_id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                new UserService(request).updateRole(request.params.id, request.payload.role_id)
                    .then(socketResponse(request, reply, 'user-changed'), reject(reply));
            }
        },
        {
            //admin updates the user in a tenant (ie. role)
            method: "PUT",
            path: "/api/{tenantId}/users/{id}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        id: Joi.number().required(),
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)) {
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                request.payload.id = request.params.id;
                new UserService(request).updateUser(request.payload)
                .then(socketResponse(request, reply, 'user-changed'), reject(reply));

            }
        },
        {
            //remove user from tenant
            method: "DELETE",
            path: "/api/{tenantId}/users/{id}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        id: Joi.number().required(),
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                new UserService(request).removeUserFromTenant(request.params.id)
                    .then(socketResponse(request, reply, 'user-deleted', request.params.tenantId), reject(reply));
            }
        },

        {
            method: "POST",
            path: "/api/{tenantId}/users/invite",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        email: Joi.string().email().required(),
                        role_id: Joi.number(),
                        user_metadata: Joi.object()
                    },
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {

                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                new UserService(request).inviteUserToTenant(request.payload)
                    .then(socketResponse(request, reply, 'user-changed'), reject(reply));
            }

        },
        {
            method: "POST",
            path: "/api/{tenantId}/users/invite/resend",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        pendingUserId: Joi.number().required()
                    },
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {

                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                new UserService(request).resendInviteUserToTenant(request.payload.pendingUserId).then(reply, reject(reply));
            }

        },
        {
            //get list of all users and admins (to be assigned to a ticket)
            method: "GET",
            path: "/api/{tenantId}/users/assignable/{formId}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
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
                if (!new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new UserService(request).getAssignableUsers(request.params.formId, request.params.tenantId).then(reply, reject(reply));
            }
        },
        {
            //get list of all users and admins (to be assigned to a ticket)
            method: "GET",
            path: "/api/{tenantId}/users/manageTickets",
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
                if (new PermissionsService(request.auth.credentials).allowed('CanManageTickets', request.params.tenantId) ||
                    new PermissionsService(request.auth.credentials).allowed('CanEditNotes', request.params.tenantId)){

                    return new UserService(request).getManageUsers(request.params.tenantId).then(reply, reject(reply));
                }
                return reply(Boom.forbidden('Invalid permissions'));

            }
        },
        {
            method: "DELETE",
            path: "/api/{tenantId}/pendinguser/{id}",
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

                new UserService(request).removePendingUser(request.params.id).then(reply, reject(reply));
            }
        }
    ];
})();
