(function () {
    "use strict";

    let Promise = require("bluebird"),
        _ = require('lodash'),
        Base = require('./base'),
        Boom = require('boom');

    module.exports = class RolesService extends Base {
        constructor(request, tenantId) {
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.Role = this.getModel('Role');
            this.Form = this.getModel("Form");
        }

        getAllRoles() {
            // Below commented code not working
            // let $$ = this.knex.raw;

            // return this.knex('roles').where({tenant_id: this.tenantId})
            //     .select(['*', this.knex('users_roles').where('role_id', this.knex.raw('"roles"."id"')).count().as('users')]);

            return this.knex('roles').where({ tenant_id: this.tenantId })
                .select(['*', this.knex('users_roles').where('role_id', this.knex.raw('"roles"."id"')).count().as('users')]);

        }
        getRoleById(roleId) {
            return new this.Role().where({ id: roleId }).fetch();
        }
        getDefaultPermission() {
            let Setting = this.getModel("Setting");
            return new Setting({ key: 'userPermissions' }).fetch()
                .then(setting => setting.get('value'));
        }
        changeDefaultRole(id) {
            return this.Bookshelf.transaction(t =>
                new this.Role().where({ tenant_id: this.tenantId }).fetchAll()
                    .then(roles => {
                        // let existingDefaultRole = roles.findWhere(role => role.get('default') === true);                       
                        let existingDefaultRole = roles.findWhere({'default':true});
                        return existingDefaultRole.save({ default: false }, { patch: true, transacting: t })
                            .tap(() => {
                               // let roleToUpdate = roles.findWhere((role) => role.get('id') === parseInt(id, 10));
                               let roleToUpdate = roles.findWhere({'id': parseInt(id, 10) } );
                                return roleToUpdate.save({ default: true }, { patch: true, transacting: t });
                            });
                    })
            );
        }
        deleteRole(roleId) {
            return new this.Role().where({ id: roleId })
                .fetch({ withRelated: ['users'] })
                .then(this.checkExists("Role does not exist."))
                .then(role => {
                    //make sure not default:
                    if (role.get('default') === true) {
                        return Promise.reject(Boom.forbidden("Default Role cannot be deleted"));
                    }
                    if (role.related('users').length === 0) {
                        return role.destroy();
                    }
                    else {
                        return Promise.reject(Boom.forbidden("Role contains users."));
                    }
                });
        }
        createRole(model) {
            return this.Bookshelf.transaction(t =>
                new this.Role({
                    name: model.name,
                    canEdit: true,
                    default: false,
                    permissions: model.permissions,
                    tenant_id: this.tenantId
                }).save(null, { transacting: t }).then(role => {
                    let formPromises = [];
                    _.each(model.formPermissions, formPermission => {
                        formPermission.id = role.get('id');
                        formPermission.name = role.get('name');

                        formPromises.push(new this.Form({ id: formPermission.formId }).fetch().then(form => {
                            let role = form.get('roles');
                            role.assignedRoles.push({
                                id: formPermission.id,
                                name: formPermission.name,
                                canCreateTicket: formPermission.canCreateTicket,
                                canBeAssigned: formPermission.canBeAssigned
                            });
                            return form.save({ 'roles': role }, { patch: true, transaction: t });
                        }));
                    });
                    return Promise.all(formPromises).then(() => role.load(['users']));
                })
            );
        }
        updateRole(model) {
            return this.Bookshelf.transaction(t =>
                new this.Role({ id: model.id }).fetch()
                    .then(this.checkExists("Role does not exist."))
                    .then(existingRole =>
                        new this.Role({ id: model.id })
                            .save({
                                name: model.name,
                                permissions: model.permissions
                            }, { patch: true, transacting: t }))
                    .then(role => {
                        let formPromises = [];
                        _.each(model.formPermissions, formPermission => {
                            formPermission.id = role.get('id');
                            formPermission.name = role.get('name');

                            formPromises.push(new this.Form({ id: formPermission.formId }).fetch().then(form => {
                                let role = form.get('roles'),
                                    assignedRole = _.find(role.assignedRoles, { id: formPermission.id });

                                assignedRole.name = formPermission.name;
                                assignedRole.canCreateTicket = formPermission.canCreateTicket;
                                assignedRole.canBeAssigned = formPermission.canBeAssigned;
                                assignedRole.notifications = formPermission.notifications;

                                return form.save({ 'roles': role }, { patch: true, transaction: t });
                            }));
                        });
                        return Promise.all(formPromises).then(() => role);
                    })
            );
        }
    };
})();
