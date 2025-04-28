(function() {
    "use strict";

    let Promise = require("bluebird"),
        Sanitize = require('../utils/sanitize.js'),
        _ = require('lodash');

    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            hidden: ['password'],
            tableName: 'users',
            hasTimestamps: true,
            tenants: function () {
                return this.belongsToMany('Tenant');
            },
            getMetadata: function (viewAdmin, tenantId){
                return bookshelf.knex('tenants_users')
                    .leftJoin('tenants', 'tenants.id', 'tenants_users.tenant_id')
                    .where({user_id: this.id, tenant_id: tenantId})
                    .first('userTemplate', 'user_metadata')
                    .then(data =>
                        Sanitize.metadataFromTemplate(data.user_metadata, data.userTemplate, viewAdmin));
            },
            setMetadata: function (newMetadata, isAdmin, tenantId, invitedUser){
                let self = this;
                return bookshelf.knex('tenants_users')
                    .leftJoin('tenants', 'tenants.id', 'tenants_users.tenant_id')
                    .where({user_id: self.id, tenant_id: tenantId})
                    .first('userTemplate', 'user_metadata')
                    .then(data => {
                        if (invitedUser) {
                            _.each(data.userTemplate.controls, function (v) {
                                if (!v.adminOnly) {
                                    v.required = false;
                                }
                            });
                        }

                        return bookshelf.knex('tenants_users')
                            .where({user_id: self.id, tenant_id: tenantId})
                            .update({
                                user_metadata: Sanitize.metadataFromClient(newMetadata, data.user_metadata, data.userTemplate, isAdmin)
                            });
                        });
            },
            notifications: function (){
                return this.hasMany('Notification', 'user_id');
            },
            roles: function () {
                return this.belongsToMany('Role', 'users_roles', 'user_id');
            },
            assignedTickets: function (){
                return this.hasMany('SupportTicket', 'assignedTo');
            },
            createdTickets: function (){
                return this.hasMany('SupportTicket', 'createdBy');
            }
        });
    };
})();
