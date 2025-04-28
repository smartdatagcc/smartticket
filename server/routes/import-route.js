(function() {
    "use strict";

    let ImportService = require('../services/import-service'),
        _ = require("lodash"),
        Joi = require("joi"),
        Boom = require('boom'),
        PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            console.log('import', err.stack);
            reply(Boom.wrap(err));
        };
    };


    module.exports = [
        {
            method: "POST",
            path: "/api/{tenantId}/settingsimport",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number()
                    }
                },
                payload: {
                    maxBytes:5*1024*1024,
                    output: 'data',
                    parse: true,
                    allow: 'multipart/form-data'
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                if (request.payload.file && request.payload.file.length && request.payload.clearExisting) {
                    new ImportService(request).importSettings(request.payload.file, request.payload.clearExisting.toString().toLowerCase() === 'true').then(data => {
                        let io = request.server.plugins['hapi-io'].io;
                        io.sockets.in('/tenant_' + request.params.tenantId).emit('lookup-changed', request.params.tenantId);

                        reply(data);
                    }, reject(reply));
                }else{
                    reply(Boom.badRequest("Bad Parameters"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/usersimport",
            config: {
                notes: 'Requires CanViewAdminPages permission',
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
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                if (request.payload.file && request.payload.clearExisting) {
                    new ImportService(request).importUsers(
                        request.payload.file,
                        request.payload.clearExisting.toString().toLowerCase() === 'true'
                    ).then(reply, reject(reply));
                }else{
                    reply(Boom.badRequest("Missing Parameters"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/supportticketsimport",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number()
                    }
                },
                payload: {
                    maxBytes:25*1024*1024,
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data'
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                if (request.payload.file && request.payload.formId && request.payload.defaultUser && request.payload.clearExisting) {
                    new ImportService(request).importTickets(
                        request.payload.file,
                        parseInt(request.payload.formId, 10),
                        parseInt(request.payload.defaultUser, 10),
                        request.payload.clearExisting.toString().toLowerCase() === 'true'
                    ).then(reply, reject(reply));
                }else{
                    reply(Boom.badRequest("Missing Parameters"));
                }
            }
        }
    ];
})();
