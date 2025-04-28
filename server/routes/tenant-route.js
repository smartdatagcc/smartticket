(function () {
    "use strict";
    let Boom = require('boom'),
        auth = require("../services/auth"),
        Joi = require("joi"),
        TenantService = require('../services/tenant-service'),
        PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            console.log('tenant', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/tenant/{tenantId}",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                return new TenantService(request).getTenant(request.params.tenantId).then(reply, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/tenant",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                },
                payload: {
                  maxBytes:5*1024*1024
                }
            },
            handler: (request, reply) => {
                if (new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    new TenantService(request).updateTenant(request.params.tenantId, request.payload).then(response => {
                        let io = request.server.plugins['hapi-io'].io;
                        io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);


                        reply(response);
                    }, reject(reply));
                } else {
                    return reply(Boom.forbidden("Not authorized"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/logo",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number()
                    }
                },
                payload: {
                    maxBytes:5*1024*1024,
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data'
                }
            },
            handler: (request, reply) => {
                if (request.payload.file) {
                    new TenantService(request).saveLogo(request.params.tenantId, request.payload).then(response => {
                        let io = request.server.plugins['hapi-io'].io;
                        io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);


                        reply(response);
                    }, reject(reply));
                }else{
                    reject(reply);
                }
            }
        },
        {
            method: "DELETE",
            path: "/api/{tenantId}/logo",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number()
                    }
                }
            },
            handler: (request, reply) => {
                new TenantService(request).removeLogo(request.params.tenantId).then(reply, reject(reply));
            }
        }
    ];
})();
