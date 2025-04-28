(function() {
    "use strict";
    let config = require("../common.js").config();
    let Joi = require("joi");
    let Boom = require('boom');
    let auth = require("../services/auth");
    let Promise = require("bluebird");
    let LookupData = require('../services/lookup-data'),
    PermissionService = require("../services/permissions-service.js"),
        _ = require('lodash');

    var reject = function (reply){
        return function (err) {
            console.log('user', err.stack);
            reply(Boom.wrap(err));
        };
    };


    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/lookup",
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
                if (!new PermissionService(request.auth.credentials).isInTenant(request.params.tenantId)){
                    return reply(Boom.forbidden('Not In Tenant'));
                }

                //request.server.methods.getLookupData
                new LookupData(request).forceGetLookupData(request.params.tenantId).then((result) => {
                    if(!result.tenant){
                        //not founds - could be deleted...
                        reply(Boom.notFound("Tenant does not exist"));
                    }
                    reply(result);
                });
            }
        },
        {
            method: "GET",
            path: "/api/{tenantId}/registrationfields",
            config: {
                auth: false,
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: function (request, reply) {
                //request.server.methods.getLookupData
                new LookupData(request).getRegistrationFields(request.params.tenantId).then(reply, reject(reply));
            }
        },
        {
            method: "GET",
            path: "/api/{tenantId}/tenantName",
            config: {
                auth: false,
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                new LookupData(request).getTenantName(request.params.tenantId).then(reply, reject(reply));
            }
        }
    ];
})();
