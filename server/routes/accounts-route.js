(function () {
    "use strict";

    let Joi = require("joi"),
        Boom = require('boom'),
        AccountService = require("../services/account-service"),
        UserService = require("../services/user-service"),
        NotificationService = require("../services/notification-service"),
        _ = require('lodash');

    let reject = function (reply){
        return function (err) {
            console.log('accounts', err.stack);
            reply(Boom.wrap(err));
        };
    };

    module.exports = [
        {
            //Get User information,
            method: "GET",
            path: "/api/{tenantId}/account/notifications",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                new NotificationService(request).getNotifications().then(reply, reject(reply));
            }
        },
        {
            //Get User information,
            method: "DELETE",
            path: "/api/{tenantId}/account/notifications",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                var url = request.query.url;
                new NotificationService(request).clearNotifications(url).then(reply, reject(reply));
            }
        },
        {
            //Get User information,
            method: "GET",
            path: "/api/pendinguser/{token}",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    params: {
                        token: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                new AccountService(request).getPendingUser(request.params.token).then(reply, reject(reply));
            }
        },
        {
            //Save Registration Form, waiting for user to confirm email
            method: "POST",
            path: "/api/{tenantId}/account",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    payload: {
                        name: Joi.string().required(),
                        email: Joi.string().email().required(),
                        password: Joi.string().min(6).required(),
                        confirmPassword: Joi.string().min(6).required(),
                        user_metadata: Joi.any(),
                        token: Joi.string()
                    },
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                request.payload.tenantId = request.params.tenantId;

                new AccountService(request).saveRegistration(request.payload).then(reply, function (err) {
                    reply(Boom.conflict(err.message));
                });
            }
        },
        {
            method: "PUT",
            path: "/api/{tenantId}/account",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        name: Joi.string().required(),
                        email: Joi.string().email().required(),
                        user_metadata: Joi.any()
                    },
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                new AccountService(request).updateAccount(request.payload, request.params.tenantId).then(reply, reject(reply));
            }
        },
        {
            method: "PUT",
            path: "/api/account",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        name: Joi.string().required(),
                        email: Joi.string().email().required()
                    }
                }
            },
            handler: (request, reply) => {
                new AccountService(request).updateAccount(request.payload).then(reply, reject(reply));
            }
        },
        //update password
        {
            method: "PUT",
            path: "/api/account/password",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    payload: {
                        password: Joi.string().required()
                        //token: Joi.string().optional()
                    }
                }
            },
            handler: (request, reply) => {
                new AccountService(request).updatePassword(request.payload.password).then(reply, reject(reply));
            }
        },
        //forgot password
        {
            method: "POST",
            path: "/api/account/forgotpassword",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    payload: {
                        email: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                new AccountService(request).forgotPassword(request.payload.email).then(reply, reject(reply));
            }
        },
        //reset password
        {
            method: "POST",
            path: "/api/account/resetpassword",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    payload: {
                        token: Joi.string().required(),
                        password: Joi.string().required()
                    }
                }
            },
            handler: (request, reply) => {
                new AccountService(request).resetPassword(request.payload.token, request.payload.password).then(reply, reject(reply));
            }
        },
        {
            //associating a user to a tenant (note: user was created through account api)
            method: "POST",
            path: "/api/{tenantId}/account/registration",
            config: {
                auth: 'token',
                tags: ['api'],
                validate: {
                    params:{
                        tenantId: Joi.number().required()
                    }
                }
            },
            handler: (request, reply) => {
                //checking permission in service
                new UserService(request).userSelfRegistration(request.payload.metadata, request.payload.token).then(reply, reject(reply));
            }

        },
        {
            method: "POST",
            path: "/api/{tenantId}/account/confirmation",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required()
                    },
                    payload: {
                        token: Joi.string().required()
                    }
                },
                handler: (request, reply) => {
                    new AccountService(request).confirmRegistration(request.params.tenantId, request.payload.token).then(reply, reject(reply));
                }
            }
        },
        {
            method: "POST",
            path: "/api/{tenantId}/account/invitedUser",
            config: {
                auth: false,
                tags: ['api'],
                validate: {
                    params: {
                        tenantId: Joi.number().required()
                    },
                    payload: {
                        name: Joi.string().required(),
                        email: Joi.string().email().required(),
                        password: Joi.string().min(6).required(),
                        user_metadata: Joi.object(),
                        confirmPassword: Joi.string().min(6).required(),
                        token: Joi.string().required()
                    }
                },
                handler: function(request, reply) {

                    request.payload.tenantId = request.params.tenantId;

                    new AccountService(request).invitedUserRegistration(request.payload).then(reply, reject(reply));
                }
            }
        },
        {
          //Get User information,
          method: "GET",
          path: "/api/{userId}/account/reseturl",
          config: {
              auth: 'token',
              tags: ['api'],
              validate: {
                  params:{
                    userId: Joi.number().required()

                  }
              }
          },
          handler: (request, reply) => {
              new AccountService(request).getResetUrl(request.params.userId).then(reply, reject(reply));
          }
      },
      {
        method: "POST",
        path: "/api/account/resetuserpassword",
        config: {
            auth: 'token',
            tags: ['api'],
            validate: {
                payload: {
                    token: Joi.string().required(),
                    password: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            new AccountService(request).resetUserPassword(request.payload.token, request.payload.password).then(reply, reject(reply));
        }
      }
    ];
})();
