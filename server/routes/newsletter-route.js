(function () {
    "use strict";
    let Boom = require('boom');
    //let auth = require("../services/auth");
    let Joi = require("joi");
    let statusService = require("../services/status-service");
    let PermissionsService = require("../services/permissions-service");
    let EmailService = require('../services/send-email-service');

    let reject = function (reply){
        return function (err) {
            console.log('newsletter', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            method: "GET",
            path: "/api/newsletter",
            config: {
                auth: 'token',
                tags: ['api']
            },
            handler: (request, reply) => {
                let Newsletter = request.server.plugins.bookshelf.model('Newsletter');
                return new Newsletter().fetchAll().then( reply, reject(reply));
            }
        },
        {
            method: "DELETE",
            path: "/api/newsletter/{email}",
            config: {
                notes: 'Requires SU permission',
                auth: false,
                tags: ['api'],
                validate: {
                    params: {
                        email: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                if (request.auth.credentials.su) {
                    let Newsletter = request.server.plugins.bookshelf.model('Newsletter');
                    return new Newsletter().where({email: request.params.email}).fetch().then((newsletter) => {
                        if (newsletter) {
                            return newsletter.destroy();
                        } else {
                            throw new Error(Boom.notFound());
                        }
                    }).then(reply, reject(reply));
                } else {
                    reply(Boom.unauthorized("Not authorized"));
                }
            }
        },
        {
            method: "POST",
            path: "/api/newsletter",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    payload: {
                        email: Joi.string().required(),
                        name: Joi.string().required(),
                        description: Joi.string().allow(''),
                        company: Joi.string().required(),
                        employees: Joi.string().allow(''),
                        customers: Joi.string().allow(''),
                        beta: Joi.boolean(),
                        comments: Joi.string().allow('')
                    }
                }
            },
            handler: (request, reply) => {
                let Newsletter = request.server.plugins.bookshelf.model('Newsletter'),
                    Setting = request.server.plugins.bookshelf.model("Setting");
                return new Newsletter().where({email: request.payload.email}).fetch().then((newsletter) => {
                    if (!newsletter) {
                        return new Newsletter().save({
                            email: request.payload.email,
                            name: request.payload.name,
                            description: request.payload.description,
                            company: request.payload.company,
                            employees: request.payload.employees,
                            customers: request.payload.customers,
                            beta: request.payload.beta,
                            comments: request.payload.comments
                        }).then((newNewsletter) => {
                            new Setting({'key': 'notifyOnNewsletter'}).fetch().then((settings) => {
                                //need to test, this isn't super critical so wrapping in try catch
                                try {
                                    new EmailService().sendEmailOnNewsLetterSubscription(settings.get('value').emails, request.payload);
                                } catch (ex) {
                                    console.log('errors sending newsletter subscription notification email');
                                }
                            });

                            reply(newNewsletter);
                        },  reject(reply));
                    } else {
                        //reply(Boom.conflict('This email has already signed up.'));
                        //****new rule: just update their record:
                        return newsletter.save({
                            email: request.payload.email,
                            name: request.payload.name,
                            description: request.payload.description,
                            company: request.payload.company,
                            employees: request.payload.employees,
                            customers: request.payload.customers,
                            beta: request.payload.beta,
                            comments: request.payload.comments
                        }).then((newNewsletter) => {
                            new Setting({'key': 'notifyOnNewsletter'}).fetch().then((settings) => {
                                //need to test, this isn't super critical so wrapping in try catch
                                try {
                                    new EmailService().sendEmailOnNewsLetterSubscription(settings.get('value').emails, request.payload);
                                } catch (ex) {
                                    console.log('errors sending newsletter subscription notification email');
                                }
                            });

                            reply(newNewsletter);
                        },  reject(reply));
                    }
                });
            }
        }
    ];
})();
