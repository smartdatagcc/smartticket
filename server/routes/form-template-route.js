(function() {
    "use strict";
    let Boom = require('boom');
    //let auth = require("../services/auth");
    let Joi = require("joi");
    let ResponseTemplateService = require("../services/response-template-service");
    let PermissionsService = require("../services/permissions-service");

    let reject = function (reply){
        return function (err) {
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/form/{formId}/templates",
            config: {
                notes: 'Requires CanManageTickets permission',
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
                    return reply("{}"); //don't return the data, but no need to throw an error...
                }

                new ResponseTemplateService(request).get(request.params.formId).then(reply, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/form/{formId}/templates",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required(),
                        formId: Joi.number().required(),
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new ResponseTemplateService(request).update(request.params.formId, request.payload.template).then(reply, reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/form/{formId}/templates",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required(),
                        formId: Joi.number().required()
                    },
                    payload: {
                        name: Joi.string().required(),
                        content: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new ResponseTemplateService(request).add(request.params.formId, request.payload).then(reply, reject(reply));
            }
        }
    ];
})();