(function () {
    "use strict";

    let Joi = require("joi"),
        Boom = require('boom'),
        dashboardService = require("../services/dashboard-service");

    let reject = function (reply) {
        return function (err) {
            console.log('dashbaoard', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/{tenantId}/dashboard",
            config: {
                auth: 'token',
                plugins: {
                    'hapi-io': {
                        event: 'get-ticket-count'
                    }
                },
                tags: ['api'],
                validate:{
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                new dashboardService(request).getTenantDashboard(request.params.tenantId).then(reply, reject(reply));
            }
        },
        {
            method: "GET",
            // TODO: make this /api/dashbaord
            path: "/api/account/dashboard",
            config: {
                auth: 'token',
                tags: ['api'],
                validate:{
                }
            },
            handler: (request, reply) => {
                new dashboardService(request).getDashboard().then(reply, reject(reply));
            }
        }
    ];
})();
