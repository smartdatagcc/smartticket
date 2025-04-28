
    "use strict";
    let Promise = require('bluebird'),
        _ = require('lodash'),
        uuid = require('node-uuid'),
        PermissionsService = require("./permissions-service.js"),
        EmailService = require('./send-email-service'),
        LookupData = require('./lookup-data'),
        Base = require('./base'),
        Boom = require('boom');

    function addToPendingUser(PendingUsers, email, metadata, tenant, roleId){
            return new PendingUsers({
                tenant_id: tenant.get('id'),
                email: email.toLowerCase().trim()
            }).fetch()
                .then(pendingUser => {
                    if (pendingUser) {
                        return pendingUser;
                    } else {
                        return new PendingUsers({
                            tenant_id: tenant.get('id'),
                            email: email.toLowerCase().trim(),
                            role_id: roleId,
                            registrationToken: uuid.v4()
                        })
                            .setMetadata(metadata, true, tenant.get('id'))
                            .catch(err => Promise.reject(Boom.badRequest(err)))
                            .then(pendingUser => pendingUser.save());
                    }
                })
                .then(pendingUser => {
                    new EmailService().sendAddUserToTenantEmail(
                        email,
                        tenant.get('name'),
                        tenant.get('id'),
                        pendingUser.get('registrationToken'));

                    return {
                        "useradded": false
                    };
                });
    }

    module.exports = class UserService extends Base {
        constructor(request, tenantId) {
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.permissions = new PermissionsService(this.credentials);
            this.lookupData = new LookupData(request);
            this.User = this.getModel('User');
            this.PendingUsers = this.getModel('PendingUsers');
            this.Tenant = this.getModel('Tenant');
        }

        removePendingUser (id) {
            return new this.PendingUsers({id, tenant_id: this.tenantId}).fetch()
                .then(this.checkExists("PendingUser does not exist"))
                .then(pendingUser => pendingUser.destroy());
        }

        addExistingUserToTenant(existingUser, tenant, roleId, metadata, isAdmin) {
            let user = existingUser.toJSON();
            if (user.tenants.length === 0) {
                return Promise.join(
                    tenant.users().attach([user.id])
                        .then (()  => existingUser.setMetadata(metadata, isAdmin, tenant.id, true))
                        .catch(err => Promise.reject(Boom.badRequest(err))),
                    existingUser.roles().attach([roleId]),
                    function (){
                        return {
                            id: user.id,
                            "useradded": true
                        };
                    });

            } else {
                return Promise.reject(Boom.conflict('This user already exists in this workspace.'));
            }
        }

        userSelfRegistration (metadata, token) {
            return new this.Tenant({id: this.tenantId}).fetch({
                withRelated: ['roles']
            }).then(tenant => {
                let inviteOnly = tenant.get('tenantSettings').settings.registrationInviteOnly;
                let domains = tenant.get('tenantSettings').settings.restrictedRegistrationDomain;

                let arrDomain = domains.split(',').map(d=> d.trim());

                const domain = arrDomain.find(domain => this.credentials.email.indexOf(domain) > 0);

                let roles = tenant.related('roles').toJSON();
                let userRole  = _.find(roles, {default: true}).id;

                if (!inviteOnly || (inviteOnly && domain && this.credentials.email.lastIndexOf(domain) + domain.length === this.credentials.email.length )) {
                    return new this.User({id: this.credentials.id}).fetch({
                        withRelated: [{
                            'tenants': (qb) => qb.where('tenant_id', this.tenantId)
                        }, 'tenants.roles']
                    }).then(existingUser => this.addExistingUserToTenant(existingUser, tenant, userRole, metadata, false));
                }

                if (token) {
                    return new this.PendingUsers().where({
                        tenant_id: this.tenantId,
                        registrationToken: token
                    }).fetch().then(pendingUser => {
                        if (pendingUser) {
                            userRole = pendingUser.get('role_id') || userRole;
                            return pendingUser.destroy()
                                .then(() =>
                                    this.User.forge({id: this.credentials.id}).fetch({
                                        withRelated: [
                                            {'tenants': (qb) => qb.where('tenant_id', this.tenantId)},
                                            'tenants.roles'
                                        ]
                                    }))
                                .then(existingUser => this.addExistingUserToTenant(existingUser, tenant, userRole, pendingUser.get('user_metadata'), false));
                        } else {
                            return Promise.reject(Boom.forbidden("Unable to complete registration, contact your administrator"));
                        }
                    });
                } else{
                    // throw error
                    return Promise.reject(Boom.forbidden("Unable to complete registration, contact your administrator"));
                }
            });
        }

        resendInviteUserToTenant (pendingUserId){
            return new this.Tenant({id:this.tenantId}).fetch().then(tenant => {
                new this.PendingUsers({
                    id: pendingUserId,
                    tenant_id: this.tenantId
                }).fetch().then(pendingUser => {
                        new EmailService().sendAddUserToTenantEmail(
                            pendingUser.get('email'),
                            tenant.get('name'),
                            tenant.get('id'),
                            pendingUser.get('registrationToken'));

                        return {
                            id: pendingUserId,
                            "useradded": true
                        };
                    });
            });
        }

        inviteUserToTenant (model) {
            model.email = model.email.toLowerCase().trim();

            return new this.Tenant({id: this.tenantId}).fetch({
                withRelated: ['roles']
            }).then((tenant) => {

                    const isRestricted = tenant.get('tenantSettings').settings.restrictRegistrationToDomain;
                    const domains = tenant.get('tenantSettings').settings.restrictedRegistrationDomain;

                    let arrDomain = domains.split(',').map(d => d.trim());

                    const domain = arrDomain.find(domain => model.email.indexOf(domain) > 0);

                    if (isRestricted && (domain === undefined || !!!domain)) {
                      return Promise.reject(Boom.badRequest('Email must be a part of the ' + domains + ' domain(s)'));
                    }

                    new this.User({email: model.email.toLowerCase().trim()}).fetch({
                        withRelated: [{
                            'tenants': qb => qb.where('tenant_id', this.tenantId)
                        }, 'tenants.roles']
                    }).then((existingUser) => {
                        //add to the tenant using the default role
                        let tenantToJson = tenant.toJSON();
                        let role = _.find(tenantToJson.roles, {id: model.role_id});
                        if (!role) {
                            role = _.find(tenantToJson.roles, {default: true});
                        }
                        if (existingUser) {
                            let isAdmin = this.permissions.allowed("CanManageTickets", this.tenantId);
                            return this.addExistingUserToTenant(existingUser, tenant, role.id, model.user_metadata, isAdmin);
                        } else {
                            return addToPendingUser(this.PendingUsers, model.email, model.user_metadata, tenant, role.id);
                        }
                    });
                }
            );
        }

        removeUserFromTenant (id) {
            //allow SU to do this because it won't prevent them from reaccessing
            if (!this.credentials.su && this.credentials.id === id) {
                return Promise.reject(Boom.forbidden("Cannot delete yourself."));
            }

            return this.knex('users_roles')
                .join('roles', 'roles.id', 'users_roles.role_id')
                .where('tenant_id', '=', this.tenantId)
                .andWhere('user_id', '=', id)
                .select('roles.id as role_id').first()
                .then((role) =>
                    this.knex('users_roles')
                        .where('role_id', role.role_id)
                        .andWhere('user_id', id).del())
                .then(() =>
                    this.knex('tenants_users')
                        .where('tenant_id', this.tenantId)
                        .andWhere('user_id', id).del());
        }

        updateRole (id, roleId) {
            let Role = this.getModel("Role");

            if (!this.credentials.su && this.credentials.id === id){
                return Promise.reject(Boom.forbidden("Cannot change your current role."));
            }

            return this.Bookshelf.transaction((t) =>
                    new Role().where({'tenant_id': this.tenantId}).fetchAll()
                        .then((roles) => new this.User({id: id}).fetch({withRelated: ['roles']})
                            .then((user) => {
                                let roleIds = roles.map(model => model.get('id'));
                                return user.related('roles').detach( roleIds, {transacting: t})
                                    .then(() =>
                                        user.related('roles').attach({role_id: roleId}, {transacting: t}));
                            })
                    )
            );
        }

        updateUser (model) {
            let Role = this.getModel("Role");

            return this.Bookshelf.transaction(t =>
                    new this.User({id: model.id})
                        .fetch({withRelated: ['roles', 'tenants']})
                        .tap (user => user.setMetadata(model.user_metadata, this.permissions.allowed("CanViewAdminPages", this.tenantId), this.tenantId))
                        .catch(err => Promise.reject(Boom.badRequest(err)))
                        .tap (user => {
                            if (this.credentials.id === model.id){
                                return Promise.reject(Boom.forbidden("Cannot change your current role."));
                            }

                            if (model.role_id) {
                                return new Role().where({'tenant_id': this.tenantId}).fetchAll().then(roles => {
                                    let roleIds = roles.map(model => model.get('id'));
                                    return user.related('roles').detach(roleIds, {transacting: t})
                                        .then(() => user.related('roles').attach({role_id: model.role_id}, {transacting: t}));
                                });
                            } else {
                                return Promise.reject(Boom.conflict("No role selected; no changes made."));
                            }
                        })
                        .then(user => {
                            if(user.get('email') !== model.email.toLowerCase().trim()){
                                return this.lookupData.getUserByEmail(model.email.toLowerCase().trim(), this.tenantId)
                                .then(u => {
                                    if (!u) {
                                        return user.save({email: model.email.toLowerCase().trim()}, {patch:true});
                                    } else {
                                        return Promise.reject(Boom.conflict('This user already exists in this workspace.'));
                                    }
                                });
                            } else {
                                return user;
                            }
                        })
            );
        }

        getPendingUsers () {
            return new this.PendingUsers().where({'tenant_id': this.tenantId}).fetchAll();
        }

        getAllUsers () {
            let SupportTicket = this.knex.bind(this, 'supportTickets'),
                $$ = this.knex.raw;

            let assignedTickets = SupportTicket().count('*')
                .where('assignedTo',  this.knex.raw('users.id'))
                .andWhere('deleted', false) //new rule https://www.pivotaltracker.com/story/show/106251814 per Stefan, don't include deleted, but include archive
                .andWhere('tenantId', this.tenantId)
                .as('assignedTickets');
            let createdTickets = SupportTicket().count('*')
                .where('createdBy',  this.knex.raw('users.id'))
                .andWhere('deleted', false) //new rule https://www.pivotaltracker.com/story/show/106251814 per Stefan, don't include deleted, but include archive
                .andWhere('tenantId', this.tenantId)
                .as('createdTickets');

            return this.knex('users_roles')
                .join('roles', 'roles.id', 'users_roles.role_id')
                .join('users', 'users.id', 'users_roles.user_id')
                .join('tenants_users', 'tenants_users.user_id', 'users_roles.user_id')
                .where('roles.tenant_id', '=', this.tenantId)
                .andWhere('tenants_users.tenant_id', '=', this.tenantId)
                .andWhere('deleted', '!=', true)
                .select('users.*', 'tenants_users.user_metadata', 'roles.name as roleName', 'roles.id as role_id', assignedTickets, createdTickets);
        }
        getUser (id) {
            return new this.User({id: id, deleted: false})
                .fetch({withRelated: 'roles'})
                .then(this.checkExists("The user was not found"))
                .then(user =>
                    user.getMetadata(new PermissionsService(this.credentials).allowed("CanManageTickets", this.tenantId), this.tenantId)
                        .then((metadata) => {
                            let val = user.toJSON(),
                                role = user.related('roles').findWhere({tenant_id: this.tenantId});

                            val.user_metadata = metadata;
                            if(role) {
                                val.role_id = role.id;
                            }else{
                                val.role_id = null;  //most likely we are looking at a profile of a user removed from the tenant
                            }

                            return val;
                        }));
        }

        getAssignableUsers (formId, tenantId) {
            let  Form = this.Bookshelf.model("Form");

            return new Form({id:formId}).fetch().then(form => {
                let assignableRoleIds = _.map(_.filter(form.get('roles').assignedRoles, {canBeAssigned:true}), "id");
                return this.knex('users_roles')
                    .join('roles', 'roles.id', 'users_roles.role_id')
                    .join('users', 'users.id', 'users_roles.user_id')
                    .where('roles.tenant_id', '=', this.tenantId)
                    .andWhere('deleted', '!=', true)
                    .andWhere('roles.id', 'in', assignableRoleIds)
                    .select('users.*', 'roles.name as roleName', 'roles.id as role_id')
                    .orderBy('users.name', 'asc').orderBy('roleName', 'asc');
            });
        }

        getManageUsers (tenantId) {
           return this.knex('users_roles')
                    .innerJoin('roles', 'roles.id', 'users_roles.role_id')
                    .innerJoin('users', 'users.id', 'users_roles.user_id')
                    .where('roles.tenant_id', '=', this.tenantId)
                    .andWhere('deleted', '!=', true)
                    .andWhere(this.knex.raw("(roles.permissions->'access'->'CanManageTickets') = 'true'::JSONB"))
                    .andWhere(this.knex.raw("(roles.permissions->'access'->'CanEditNotes') = 'true'::JSONB"))
                    .select('users.name', 'users.email', 'users.id')
               .orderBy('users.name', 'asc');
        }
    };

