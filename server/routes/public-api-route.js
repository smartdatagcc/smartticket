(function () {
    "use strict";

    let Joi = require("joi"),
        Boom = require('boom'),
        _ = require('lodash'),
        NotificationService = require("../services/notification-service.js"),
        SupportTicketService = require("../services/support-ticket-service"),
        LookupData = require('../services/lookup-data'),
        //domain = /^https?:\/\/([^:\/]+)/;
        domain = /^https?:\/\/(?:www.)?([^:\/]+)/;

    let reject = function (reply){
        return function (err) {
            console.log('support-ticket', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            //GET ALL Forms:
            method: "GET",
            path: "/public-api/{tenantId}/forms",
            config: {
                auth: false,
                tags: ['api'],
                cors: true,
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {


                new LookupData(request).forceGetLookupData(request.params.tenantId).then((result) => {
                    if(!result.tenant){
                        //not founds - could be deleted...
                        return reply(Boom.badRequest("Tenant does not exist"));
                    }

                    if (!request.headers['referer']){
                        reply(Boom.badRequest("referrer header not provided"));
                    }
                    let refDomain = domain.exec(request.headers['referer'])[1];
                    let refs = (result.tenant.tenantSettings.settings.apiRefs || "").split(/[\r\n ]+/g);

                    if (request.payload.ApiKey === result.tenant.tenantSettings.settings.apiKey &&
                        (refDomain === 'localhost' || _.indexOf(refs, refDomain) > -1)){

                        reply(_(result.tenant.forms)
                            .filter(function (form){return form.settings.details.allowPublic;})
                            .map(function (form){
                                return {
                                    name: form.name,
                                    ticketTemplate: {
                                        controls: _.map(form.ticketTemplate.controls, (v) => {
                                            delete v.adminOnly;
                                            delete v.value;
                                            return v;
                                        })
                                    }
                                };
                            }));

                    }else{
                        reply(Boom.badRequest("Invalid api key or domain"));
                    }


                    reply(result);
                });
            }
        },
        {
            method: "POST",
            path: "/public-api/{tenantId}/tickets",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {

                new LookupData(request).forceGetLookupData(request.params.tenantId).then(result => {
                    if(!result.tenant){
                        //not founds - could be deleted...
                        return reply(Boom.badRequest("Tenant does not exist"));
                    }

                    if (!request.headers['referer']){
                        reply(Boom.badRequest("referrer header not provided"));
                    }


                    let returnUrl = request.payload.SuccessUrl || result.tenant.tenantSettings.settings.apiReturnUrl || '/';
                    let errorUrl = request.payload.ErrorUrl || result.tenant.tenantSettings.settings.apiErrorUrl || '/';
                    let refDomain = request.headers['referer'] ? domain.exec(request.headers['referer'])[1] : null;
                    let refs = (result.tenant.tenantSettings.settings.apiRefs || "").split(/[\r\n ]+/g);
                    let domainCheck = _.find([...refs, 'localhost', '0.0.0.0'], function(r) { return refDomain && r.includes(refDomain); });

                    if (request.payload.ApiKey === result.tenant.tenantSettings.settings.apiKey && domainCheck && domainCheck !== undefined){

                        let newPayload = {metadata:  {controls: []}};

                        _.each(request.payload, (val, key) => {
                            switch(key){
                                case 'FormId':
                                    newPayload[key[0].toLowerCase() + key.substr(1)] = val;
                                    break;
                                case 'ApiKey':
                                case 'ErrorUrl':
                                case 'SuccessUrl':
                                    break;
                                default:
                                    newPayload.metadata.controls.push({name: key, value: val});

                            }
                        });

                        let form = _.find(result.tenant.forms, {id: parseInt(newPayload.formId, 10)});
                            newPayload.statusType = _.result(form.statusTypes.statusIds[0], "id");
                            newPayload.createdBy = result.tenant.tenantSettings.settings.apiUser;
                            newPayload.updatedBy = result.tenant.tenantSettings.settings.apiUser;

                            return new SupportTicketService(request).insertTicket(newPayload, result.tenant.tenantSettings.settings.emailNotification, result.tenant.name)
                            .then(ticket => {
                                let io = request.server.plugins['hapi-io'].io;
                                io.sockets.in('/tenant_' + request.params.tenantId).emit('ticket-changed', ticket.get('id'));

                                reply.redirect(returnUrl);
                            }, reject(function (err){
                                console.log('support-ticket API error', err.stack);

                                reply.redirect(errorUrl + '?message=' + encodeURIComponent(err.toString()));

                            }));


                    }else{
                        reply(Boom.badRequest("Invalid api key or domain"));
                    }
                });
            }
        }
    ];
})();

