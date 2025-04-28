(function() {
    "use strict";

    let Joi = require("joi"),
        Boom = require('boom'),
        SupportTicketService = require("../services/support-ticket-service"),
        PermissionsService = require("../services/permissions-service"),
        GeneratePDFService = require("../services/generate-pdf-service"),
        ExportService = require('../services/export-service'),
        path = require('path'),
        fs = require('fs'),
        pdf = require('html-pdf'),
        stream = require('stream');

    let reject = function (reply){
        return function (err) {
            console.log('auth', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/settingsexport",
            config: {
                notes: 'Requires CanViewAdminPages permission',
                auth: 'token',
                tags: ['api'],
                validate:{
                    params: {
                        tenantId: Joi.number()
                    }
                }
            },
            handler: (request, reply) => {
                if (!new PermissionsService(request.auth.credentials).allowed('CanViewAdminPages', request.params.tenantId)){
                    return reply(Boom.forbidden('Invalid permissions'));
                }
                new ExportService(request).exportSettings().then(settings =>
                    reply(settings)
                        .header('Content-disposition', 'attachment; filename=settings.json')
                        .spaces(2),
                    reject(reply));

            }
        },
        {
            method: "POST",
            path: "/api/generate-pdf",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    options: {stripUnknown:true},
                    payload: {
                        document: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                return new GeneratePDFService(request).generatePDF(request.payload.document).toStream(function (err, s) {
                    if (err) {
                        return reject(reply)(err);
                    }
                    // reply with a pdf stream
                    // WILL NOT WORK WITH GRUNT
                    reply(s).encoding('binary').type('application/pdf');
                });
            }
        }
    ];
})();
