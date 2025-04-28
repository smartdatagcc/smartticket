(function() {
    "use strict";

    let Joi = require("joi"),
        Boom = require('boom'),
        AccountService = require('../services/account-service');

    let reject = function (reply){
        return function (err) {
            console.log('auth', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "POST",
            path: "/api/auth",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    payload: {
                        email: Joi.string().required(),
                        password: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.headers.authorization) {
                    reply(Boom.conflict('Already authenticated'));
                } else {
                    new AccountService(request).getAuthToken(request.payload.email, request.payload.password).then(token =>{
                        if(token){
                            reply({token: token});
                        }else{
                            reply(Boom.unauthorized("Not authorized - please check your username and/or password"));
                        }
                    }, reject(reply));
                }
            }
        },
        {
            method: "POST",
            path: "/api/auth/refresh",
            config: {
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                new AccountService(request).getRefreshToken(request.headers.authorization).then(token =>{
                    if(token){
                        reply({token: token});
                    }else{
                        reply(Boom.unauthorized("Not authorized - please check your username and/or password"));
                    }
                }, reject(reply));
            }
        }
    ];
})();
