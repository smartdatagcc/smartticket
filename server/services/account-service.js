(function () {
    "use strict";
    let Promise = require('bluebird'),
        jwt = require('jsonwebtoken'),
        config = require("../common.js").config(),
        uuid = require('node-uuid'),
        moment = require('moment'),
        _ = require('lodash'),
        PermissionsService = require("./permissions-service.js"),
        EmailService = require("./send-email-service.js"),
        Base = require("./base"),
        bcrypt = require('bcryptjs'),
        Boom = require('boom'),
        tiers = require('../utils/tiers');


    Promise.promisifyAll(bcrypt);

    function signToken(user) {
        let opt = {
            expiresIn: config.tokenExpiration * 60,
            issuer: config.tokenIssuer
        };
        return jwt.sign(user, config.privateKey, opt);
    }
    module.exports = class AccountService extends Base {
        constructor(request, tenantId) {
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.User = this.getModel('User');
            this.Tenant = this.getModel('Tenant');
            this.PendingUsers = this.getModel('PendingUsers');
            this.permissions = new PermissionsService(this.credentials);
        }

        getResetUrl(userId) {

          if(this.credentials.deleted || !this.credentials.su){
            return Promise.reject(Boom.forbidden("Unauthorized"));
          }

          let User = this.getModel('User');

          return this.Bookshelf.transaction(t =>
            new User({id: userId, deleted: false}).fetch()
                .then((user) => {
                  if(!user){
                    Promise.reject(Boom.create(400, "User does not exist"));
                  }

                  if (!user.attributes.resetPasswordToken || !user.attributes.resetPasswordExpires ||  moment().isAfter(user.attributes.resetPasswordExpires)) {
                    return user.save({
                      resetPasswordToken: uuid.v4(),
                      resetPasswordExpires: moment().add(3, 'days').toDate()
                    }, {patch: true, transacting: t});
                  }
                  else
                  {
                    return user;
                  }
              })
            );
        }

        resetUserPassword(token, password) {
          if(this.credentials.deleted || !this.credentials.su){
            return Promise.reject(Boom.forbidden("Unauthorized"));
          }

          return this.resetPassword(token, password);
        }


        //this is path of self-registration
        register(pendingUser) {
            let Role = this.getModel("Role");

            //first need to validate email and tenantId doesn't already exist
            return new this.User({ email: pendingUser.get('email').toLowerCase(), deleted: false })
                .fetch()
                .then(existingUser => {
                    if (existingUser !== null) {
                        return Promise.reject(Boom.conflict("User with same email already exists"));
                    }
                    return this.Bookshelf.knex.from('tenants').innerJoin('tenants_users', 'tenants.id', 'tenants_users.tenant_id').where('tenants.id', this.tenantId).then(function (tenantUsers) {
                        if (tenantUsers.length > 0 && tenantUsers.length >= tiers[tenantUsers[0].tier].users) {
                            return Promise.reject(Boom.forbidden("This tenant has already reached their maximum number of users."));
                        }
                    });
                })
                .then(() =>
                    //user does not exist - take pending user info and create a new user:
                    this.Bookshelf.transaction(t =>
                        new this.User({
                            name: pendingUser.get('name'),
                            email: pendingUser.get('email').toLowerCase(),
                            password: pendingUser.get('password')
                        })
                            .save(null, { transacting: t })
                            .tap(user =>
                                //go back to pending user table to get all instances of a user with this email:
                                new this.PendingUsers().where({
                                    email: pendingUser.get('email').toLowerCase()
                                }).fetchAll()
                                    .then(pend =>
                                        //get each instance and the tenantId it was registered with
                                        pend.mapThen(pending =>
                                            //map the user to the tenant along with the metadata and insert into tenant_users
                                            t.insert({
                                                user_id: user.id,
                                                tenant_id: pending.get('tenant_id'),
                                                user_metadata: pending.get('user_metadata')
                                            }).into('tenants_users')
                                                .then(() =>
                                                    //fetch all the roles for this tenant:
                                                    new Role().where({ tenant_id: pending.get('tenant_id') }).fetchAll()
                                                        .then(roles => {
                                                            //get the default - we are now determining what role should be attached to the user:
                                                            let roleId;
                                                            //get the pending user object from the fetch above
                                                            let specifiedRole = roles.findWhere({ 'id': pending.get('role_id') });
                                                            if (specifiedRole) {  //the role still exists... user it:
                                                                roleId = specifiedRole.get('id');
                                                            } else { //the role no longer exists, get the default...
                                                                roleId = roles.findWhere({ 'default': true }).get('id');
                                                            }
                                                            //attach the role to this user
                                                            return user.related('roles')
                                                                .attach({ role_id: roleId }, { transacting: t });
                                                        }))
                                                .then(() => pending.destroy({ transacting: t }))  //this should be the object... clear it from the database...
                                        )
                                    )
                            )
                    )
                );
        }

        updateAccount(model, tenantId) {
            return this.Bookshelf.transaction(t =>
                new this.User({ id: this.credentials.id, deleted: false })
                    .fetch()
                    .then(this.checkUserExists())
                    .then(existingUser => {
                        if (model.email.toLowerCase().trim() !== existingUser.get('email')) {
                            return new this.User().where({
                                email: model.email.toLowerCase().trim()
                            }).fetch().then(collision => {
                                if (collision !== null) {
                                    return Promise.reject(Boom.conflict("User with same email already exists"));
                                }
                                return existingUser;
                            });
                        } else {
                            return existingUser;
                        }
                    })
                    .then(existingUser =>
                        new this.User({ id: this.credentials.id })
                            .save({
                                name: model.name,
                                email: model.email.toLowerCase().trim()
                            }, { patch: true, transacting: t })
                    )
                    .tap(user => {
                        if (model.user_metadata && tenantId) {
                            return user.setMetadata(model.user_metadata, new PermissionsService(this.credentials).allowed("CanManageTickets", tenantId), tenantId)
                                .catch((err) => Promise.reject(Boom.badRequest(err)));
                        }
                    })
            );
        }
        getPendingUser(token) {
            return new this.PendingUsers()
                .where({ registrationToken: token })
                .fetch()
                .then(pendingUser => {
                    if (pendingUser) {
                        return pendingUser.sanitizeMetadata(this.permissions.allowed("CanViewAdminPages", this.tenantId));
                    } else {
                        return Promise.reject(Boom.badRequest("Pending User not found"));
                    }
                });
        }
        updatePassword(password) {
            return this.Bookshelf.transaction((t) =>
                new this.User({ id: this.credentials.id, deleted: false }).fetch()
                    .then(this.checkUserExists())
                    .then(existingUser => existingUser.save({
                        password: bcrypt.hashSync(password)
                    }, { patch: true, transacting: t })
                        .then(user => new EmailService().sendPasswordChangedEmail(user.get('email')))
                    )
            );
        }
        forgotPassword(email) {
            return this.Bookshelf.transaction(t =>
                new this.User({
                    email: email.toLowerCase().trim(),
                    deleted: false
                }).fetch({ withRelated: ['tenants'] })
                    .then(this.checkUserExists())
                    .then(existingUser => {
                        let u = existingUser.toJSON();
                        if (u.tenants.length > 0) {
                            return existingUser.save({
                                resetPasswordToken: uuid.v4(),
                                resetPasswordExpires: moment().add(3, 'days').toDate()
                            }, { patch: true, transacting: t })
                                .then(user => new EmailService().sendMailOnForgotPassword(user.get('email'), user.get('resetPasswordToken')))
                        } else {
                            return Promise.reject(Boom.conflict("User not found."));
                        }
                    })
            );
        }
        resetPassword(token, password) {
            return this.Bookshelf.transaction(t =>
                new this.User({
                    resetPasswordToken: token,
                    deleted: false
                }).fetch()
                    .then(this.checkUserExists())
                    .then((existingUser) => {
                        if (moment().isBefore(existingUser.get('resetPasswordExpires'))) {
                            return bcrypt.genSaltAsync(10)
                                .then(salt => bcrypt.hashAsync(password, salt))
                                .then(hash => existingUser.save({ password: hash }, { patch: true, transacting: t }));
                        } else {
                            return Promise.reject(Boom.forbidden("Password reset token has expired."));
                        }
                    })
            );
        }
        //Mass-send password resets to Tenant's users
        sendResetPasswordEmail(tenantId) {
            return new this.Tenant({ id: tenantId }).fetch({ withRelated: [{ 'users': qb => qb.where('deleted', false) }] }).then(tenant => {
                return tenant.related('users').toJSON();
            }).each((tenantUser) => {
                return this.Bookshelf.transaction(t =>
                    new this.User({
                        email: tenantUser.email
                    }).fetch()
                        .then(this.checkUserExists())
                        .then(existingUser => existingUser.save({
                            resetPasswordToken: uuid.v4(),
                            resetPasswordExpires: moment().add(3, 'days').toDate()
                        }, { patch: true, transacting: t }))
                        .then(user => new EmailService().sendResetPasswordEmail(user.get('email'), user.get('resetPasswordToken')))
                );
            });
        }
        saveRegistration(model) {
            let Tenant = this.getModel("Tenant"),
                registrationEmail = model.email.toLowerCase().trim();

            return new this.User({
                email: registrationEmail.toLowerCase().trim(),
                deleted: false
            }).fetch()
                .then((existingUser) => {
                    if (existingUser) {
                        return Promise.reject(Boom.conflict("User with same email already exists"));
                    }
                }).then(() =>
                    new Tenant({ id: model.tenantId }).fetch()
                        .then(tenant => {
                            let inviteOnly = tenant.get('tenantSettings').settings.registrationInviteOnly;
                            let domain = tenant.get('tenantSettings').settings.restrictedRegistrationDomain;
                            if (!inviteOnly || (inviteOnly && _.includes(registrationEmail, domain))) {
                                return new this.PendingUsers({
                                    email: registrationEmail.toLowerCase().trim(),
                                    tenant_id: model.tenantId
                                }).fetch()
                                    .then(pendingUser =>
                                        this.Bookshelf.transaction(t =>
                                            bcrypt.genSaltAsync(10)
                                                .then(salt => bcrypt.hashAsync(model.password, salt))
                                                .then(hash => {
                                                    if (pendingUser) {
                                                        return pendingUser
                                                            .setMetadata(model.user_metadata, false, this.tenantId)
                                                            .catch(err => Promise.reject(Boom.badRequest(err)))
                                                            .then(pendingUser => pendingUser.save({
                                                                registrationToken: uuid.v4(),
                                                                name: model.name,
                                                                password: hash,
                                                                hasRegistered: false
                                                            }, { patch: true, transacting: t }));
                                                    } else {
                                                        return new this.PendingUsers({
                                                            email: registrationEmail.toLowerCase().trim(),
                                                            tenant_id: model.tenantId,
                                                            registrationToken: uuid.v4(),
                                                            name: model.name,
                                                            password: hash,
                                                            hasRegistered: false
                                                        })
                                                            .setMetadata(model.user_metadata, false, this.tenantId)
                                                            .catch(err => Promise.reject(Boom.badRequest(err)))
                                                            .then(pendingUser => pendingUser.save(null, { transacting: t }));
                                                    }
                                                })
                                                .then(pendingUser => {
                                                    new EmailService().sendRegistrationConfirmationEmail(
                                                        pendingUser.get('email'),
                                                        tenant.get('name'),
                                                        model.tenantId,
                                                        pendingUser.get('registrationToken'));

                                                    if (pendingUser.get('password')) {
                                                        pendingUser.unset('password');
                                                    }

                                                    return pendingUser.sanitizeMetadata(this.permissions.allowed("CanViewAdminPages", this.tenantId));
                                                })
                                        )
                                    );
                            }
                        })
                );
        }
        confirmRegistration(tenantId, token) {
            //confirm we have this record in our pending user table....
            return new this.PendingUsers().where({
                tenant_id: tenantId,
                registrationToken: token
            }).fetch().then(pendingUser => {
                if (pendingUser) {
                    //is in table... now we need to create the user....
                    return this.register(pendingUser);
                } else {
                    return Promise.reject(Boom.forbidden("Unable to confirmation registration, contact your administrator"));
                }
            });
        }
        invitedUserRegistration(model) {
            //confirm we have this record in our pending user table....
            return new this.PendingUsers().where({
                tenant_id: model.tenantId,
                registrationToken: model.token
            }).fetch().then(pendingUser => {
                if (pendingUser) {
                    //is in table... now we need to update the record(password and name)....
                    //then we are able to call the same function confirmRegistration uses(register)
                    return bcrypt.genSaltAsync(10)
                        .then(salt => bcrypt.hashAsync(model.password, salt))
                        .then(hash =>
                            pendingUser
                                .setMetadata(model.user_metadata, false, this.tenantId)
                                .catch(err => Promise.reject(Boom.badRequest(err)))
                                .then(pendingUser => pendingUser.save({
                                    name: model.name,
                                    password: hash,
                                    hasRegistered: true,
                                    user_metadata: model.user_metadata
                                }, { patch: true })))
                        .then(pendingUser => this.register(pendingUser));
                } else {
                    return Promise.reject(Boom.forbidden("Unable to complete registration, contact your administrator"));
                }
            });
        }
        getAuthToken(email, password) {
            return new this.User({ email: email.toLowerCase().trim() }).fetch({
                withRelated: [{
                    'tenants': qb => qb.where('deleted', false)
                }, 'roles']
            }).then(user => {
                if (user) {
                    return bcrypt.compareAsync(password, user.get('password')).then(res => {
                        if (res) {
                            let jsonUser = user.toJSON();
                            jsonUser.tenants = _.map(jsonUser.tenants, t => ({
                                id: t.id,
                                name: t.name
                            }));
                            return signToken(jsonUser);
                        } else {
                            return null;
                        }
                    });
                } else {
                    return null;
                }
            });
        }
        getRefreshToken(authToken) {
            let currentToken,
                isAuthorized = false;
            if (authToken) {
                currentToken = authToken.split(" ");
                if (currentToken && currentToken.length > 0) {
                    let profile = jwt.verify(currentToken[1], config.privateKey);
                    if (profile) {
                        //let's go out and refetch the user data for any updates to it:
                        return new this.User({ id: profile.id }).fetch({
                            withRelated: [{
                                'tenants': qb => qb.where('deleted', false)
                            }, 'roles']
                        }).then(user => {
                            if (user) {
                                isAuthorized = true;
                                let jsonUser = user.toJSON();
                                jsonUser.tenants = _.map(jsonUser.tenants, t => ({
                                    id: t.id,
                                    name: t.name
                                }));
                                return signToken(jsonUser);
                            }
                        });
                    }
                }
            }
            if (!isAuthorized) {
                return Promise.resolve(null);
            }
        }
    };
})();
