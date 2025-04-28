(function() {
    "use strict";
    let config = require("../common.js").config();
    let Joi = require("joi");
    let Boom = require('boom');
    let auth = require("../services/auth");
    let Promise = require("bluebird");
    let AttachmentsService = require("../services/attachments-service");

    let reject = function (reply){
        return function (err) {
            console.log('attachments', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/attachments/{attachmentId}",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number(),
                        attachmentId: Joi.number()
                    }
                }
            },
            handler: (request, reply) => {
                //validate permissions
                new AttachmentsService(request)
                    .getAttachment(request.params.attachmentId)
                    .then(reply, reject(reply));
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/attachments",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number()
                    }
                },
                payload: {
                    maxBytes:20*1024*1024,
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data'
                }
            },
            handler: (request, reply) => {
                if (request.payload.file && request.payload.supportTicketId) {
                    return new AttachmentsService(request)
                        .saveAttachment(request.payload.file, request.payload.supportTicketId)
                        .then((attachment) => {
                            let io = request.server.plugins['hapi-io'].io;
                            io.sockets.in('/ticket_' + request.payload.supportTicketId).emit('attachment-added', attachment);
                            reply(attachment);
                        }, reject(reply));
                }else{
                    reject(reply);
                }
            }
        },
        {
            method: "DELETE",
            path: "/api/{tenantId}/attachments/{attachmentId}",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number(),
                        attachmentId: Joi.number()
                    }
                }
            },
            handler: (request, reply) => {
                //if (!permService.allowed(request, 'CanManageTickets')){
                //    return reply(Boom.forbidden('Invalid permissions'));
                //}
                return new AttachmentsService(request).deleteAttachment(request.params.attachmentId).then((attachment) => {
                    let io = request.server.plugins['hapi-io'].io;
                    attachment.set('deletedById', request.auth.credentials.id);
                    attachment.set('deletedByName', request.auth.credentials.name);
                    io.sockets.in('/ticket_' + attachment.get('supportTicketId')).emit('attachment-deleted', attachment);
                    reply(attachment);
                }, reject(reply));
            }
        }
    ];
})();
