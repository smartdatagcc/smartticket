(function () {
    "use strict";
    let Boom = require('boom');
    let auth = require("../services/auth");
    let SuService = require('../services/su-service');
    let Joi = require("joi");
    let path = require('path');
    let Readable = require('stream').Readable;
    let AccountService = require('../services/account-service');

    let reject = function (reply){
        return function (err) {
            console.log('su', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/su/tenants",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).getAllTenants().then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "GET",
            path: "/api/su/settings",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).getAllSettings().then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "GET",
            path: "/api/su/newsletters",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).getAllNewsLetters().then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/su/tenant",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        name: Joi.string().required(),
                        tier: Joi.number().required(),
                        apiConnectivity: Joi.boolean().required(),
                        tenantSettings: Joi.object().required(),
                        ticketTemplate: Joi.object().required(),
                        userTemplate: Joi.object().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).createTenant(request.payload).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/su/resetpasswordemail",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new AccountService(request).sendResetPasswordEmail(request.payload.tenantId).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "PUT",
            path: "/api/su/{tenantId}/tenant",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).updateTenant(request.params.tenantId, request.payload).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "PUT",
            path: "/api/su/updatenotificationemails",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    payload:{
                        value: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).updateSetting('notifyOnNewsletter', request.payload).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "PUT",
            path: "/api/su/updatesetting",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    payload:{
                        key: Joi.string().required(),
                        value: Joi.object().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).updateSetting(request.payload).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
                method: "GET",
                    path: "/api/su/log",
                    config: {
                        notes: 'Requires SU permission',
                    auth: 'token',
                        tags: ['api']
                },
                handler: (request, reply) => {
                    if (request.auth.credentials.su) {
                        new SuService(request).getNodeLog(path).then(reply, reject(reply));
                    } else {
                        reply(Boom.unauthorized("Not authorized"));
                    }
                }
        },
        {
            method: "GET",
            path: "/api/su/superusers",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).getAllSuperUsers().then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/su/superusers",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        email: Joi.string().email().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).addSuperUser(request.payload.email).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "DELETE",
            path: "/api/su/superusers/{id}",
            config: {
                notes: 'Require SU permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params: {
                        id: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    new SuService(request).removeSuperUser(request.params.id).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        }
    ];
})();
