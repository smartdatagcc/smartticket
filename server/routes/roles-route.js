(function() {
    "use strict";
    let Boom = require('boom'),
        Joi = require("joi"),
        RolesService = require("../services/roles-service"),
        PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            console.log('roles', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/roles",
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

                new RolesService(request).getAllRoles().then(reply, reject(reply));
            }
        },
        {
            method: "GET",
            path: "/api/{tenantId}/roles/{roleId}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required(),
                        roleId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                new RolesService(request).getRoleById(request.params.roleId).then(reply, reject(reply));
            }
        },
        {
            method: "GET",
            path: "/api/{tenantId}/defaultpermissionaccess",
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
                new RolesService(request).getDefaultPermission().then(reply, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/roles/{id}/default",
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
                new RolesService(request).changeDefaultRole(request.params.id).then(reply, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/roles/{id}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required(),
                        id: Joi.number().required()
                    }
                    //TODO: validate payload
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                request.payload.id = request.params.id;

                new RolesService(request).updateRole(request.payload).then(result => {
                    let io = request.server.plugins['hapi-io'].io;
                    io.sockets.in('/role_' + request.params.id).emit('role-changed');

                    reply(result);
                }, reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/roles/add",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        name: Joi.string().required(),
                        permissions: Joi.object().required(),
                        formPermissions: Joi.any().required()
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

                new RolesService(request).createRole(request.payload).then(reply, reject(reply));
            }
        },
        {
            method: "DELETE",
            path: "/api/{tenantId}/roles/{id}",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        id: Joi.number(),
                        tenantId: Joi.number()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }

                new RolesService(request).deleteRole(request.params.id).then(reply, reject(reply));
            }
        }
    ];
})();
