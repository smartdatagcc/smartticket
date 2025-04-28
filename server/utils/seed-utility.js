'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    bcrypt = require('bcryptjs');

Promise.promisifyAll(bcrypt);

module.exports = class SeedUtility{
    constructor(admin_permissions, support_permissions, user_permissions, ticket_template, user_template, tenant_settings) {
        this.admin_permissions = admin_permissions;
        this.support_permissions = support_permissions;
        this.user_permissions = user_permissions;
        this.ticket_template = ticket_template;
        this.user_template = user_template;
        this.tenant_settings = tenant_settings;

        this.newSupportTicketDate = new Date();
    }

    seedPassword (password) {
        return bcrypt.genSaltAsync(10).then(salt => bcrypt.hashAsync(password, salt));
    }

    /*  public */
    addUser(knex, name, email, password, tenants, su) {
        return this.seedPassword(password).then(hash =>
                knex('users').insert({
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    password: hash,
                    su: !!su,
                    created_at: this.newSupportTicketDate,
                    updated_at: this.newSupportTicketDate
                }, 'id')
        ).get(0).tap(userId => {
                let promises = [];
                _.each(tenants, (v) => {
                    promises.push(knex('tenants_users').insert({tenant_id: v.id, user_id: userId}));
                    promises.push(knex('users_roles').insert({role_id: v.role, user_id: userId}));
                });
                return Promise.all(promises);
            });
    }

    addTicket(knex, tenantId, formId, statusId, userId, subject, message) {
        return Promise.resolve(knex('supportTickets').insert({
            formId: formId,
            //subject: subject,
            //description: message,  //no longer need to create a comment for a ticket
            statusType: statusId,
            createdBy: userId,
            updatedBy: userId,
            created_at: this.newSupportTicketDate,
            updated_at: this.newSupportTicketDate,
            tenantId: tenantId,
            deleted: false,
            metadata: {"controls": {
                subject: subject,
                description: message
            }}
        }, 'id')).get(0).then((ticketId) =>
                Promise.resolve(knex('supportTicketHistory').insert({
                    supportTicketId: ticketId,
                    reason: "Ticket created",
                    changes: {"diff:":{}},
                    formId: formId,
                    //subject: subject,
                    //description: message,  //no longer need to create a comment for a ticket
                    statusName: "Open",
                    createdBy: userId,
                    updatedBy: userId,
                    created_at: this.newSupportTicketDate,
                    updated_at: this.newSupportTicketDate,
                    tenantId: tenantId,
                    deleted: false,
                    metadata: {"controls": {
                        subject: subject,
                        description: message
                    }}
                }))
        );
    }

    addTenant(knex, name) {
        return Promise.resolve(knex('tenants').insert({
            name: name,
            tenantSettings: this.tenant_settings,
            userTemplate: this.user_template
        }, 'id')).get(0).then((tenantId) =>
                Promise.join(
                    Promise.resolve(knex('statusTypes').insert({
                        name: "Open",
                        workflowActionName: 'Open',
                        tenantId: tenantId,
                        color: '#F39C12',
                        created_at: this.newSupportTicketDate
                    }, 'id')).get(0),
                    Promise.resolve(knex('statusTypes').insert({
                        name: "Closed",
                        workflowActionName: 'Close',
                        tenantId: tenantId,
                        color: '#27AE60',
                        created_at: this.newSupportTicketDate
                    }, 'id')).get(0),
                    Promise.resolve(knex('roles').insert({
                        name: 'Admin',
                        tenant_id: tenantId,
                        canEdit: false,
                        default: false,
                        permissions: this.admin_permissions
                    }, 'id')).get(0),
                    Promise.resolve(knex('roles').insert({
                        name: 'User',
                        tenant_id: tenantId,
                        canEdit: true,
                        default: true,
                        permissions: this.user_permissions
                    }, 'id')).get(0),
                    Promise.resolve(knex('roles').insert({
                        name: 'Support',
                        tenant_id: tenantId,
                        canEdit: true,
                        default: false,
                        permissions: this.support_permissions
                    }, 'id')).get(0),

                    (openId, closedId, adminId, userId, supportId) => {
                        return Promise.resolve(knex('forms').insert({
                            name: "Ticket",
                            color: 'primary',
                            ticketTemplate: this.ticket_template,
                            tenant_id: tenantId,
                            statusTypes: {
                                "statusIds": [{"id": openId, "isWorkFlow": true}, {
                                    "id": closedId,
                                    "isWorkFlow": true
                                }]
                            },
                            roles: {"assignedRoles": [{
                                id: adminId, canCreateTicket: true, canBeAssigned: true
                            },{
                                id: userId, canCreateTicket: true, canBeAssigned: false
                            },{
                                id: supportId, canCreateTicket: true, canBeAssigned: true
                            }]}
                        }, 'id')).get(0).then((formId) => ({
                            tenantId: tenantId,
                            formId: formId,
                            openId: openId,
                            closedId: closedId,
                            adminRoleId: adminId,
                            userRoleId: userId,
                            supportRoleId: supportId
                        }));
                    })
        );
    }
};