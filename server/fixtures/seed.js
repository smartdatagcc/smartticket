'use strict';
let Promise = require('bluebird');

const admin_permissions = {
    "access": {
        "CanViewAdminPages": true,
        "CanManageTickets" : true,
        "CanEditNotes" : true,
        "CanViewNotes": true,
        "CanEditTickets": true
    }
},
    support_permissions = {
    "access": {
        "CanViewAdminPages": false,
        "CanManageTickets" : true,
        "CanEditNotes" : false,
        "CanViewNotes": true,
        "CanEditTickets": true
    }
},
    user_permissions = {
    "access": {
        "CanViewAdminPages": false,
        "CanManageTickets" : false,
        "CanEditNotes" : false,
        "CanViewNotes": false,
        "CanEditTickets": true
    }
},
    ticket_template = {
    "controls": []
},
    user_template = {
    "controls": []
},
    tenant_settings = {
    "settings": {
        "emailNotification": true,
        "assignableUsers": [],
        "registrationInviteOnly": true,
        "restrictedRegistrationDomain" : null,
        "HIPAACompliant": true
    }
};

exports.seed = function (knex) {    
    let SeedUtility = require('../utils/seed-utility');
    let seedUtility = new SeedUtility(admin_permissions, support_permissions, user_permissions, ticket_template, user_template, tenant_settings);

    ////////////////////////////////////////////////////////////////
    // Setup Script
    ////////////////////////////////////////////////////////////////

    let env = process.argv[process.argv.length-1];

    console.log(env);
    console.log(Promise);

    return Promise && Promise.join(
        // Deletes ALL existing entries
        knex('settings').del(),
        knex('tenants_users').del(),
        knex('users_roles').del(),
        knex('notes').del(),
        knex('attachments').del(),
        knex('comments').del(),
        knex('responseTemplates').del(),
        knex('supportTicketHistory').del(),
        knex('supportTickets').del(),
        knex('statusTypes').del(),
        knex('users').del(),
        knex('roles').del(),
        knex('pendingAddUsers').del(),
        knex('forms').del(),
        knex('tenants').del(),
        knex('settings').insert({
            key: 'adminPermissions',
            value: admin_permissions
        }),
        knex('settings').insert({
            key: 'userPermissions',
            value: user_permissions
        }),
        knex('settings').insert({
            key: 'supportUserPermissions',
            value: support_permissions
        }),
        knex('settings').insert({
            key: 'ticketTemplate',
            value: ticket_template
        }),
        knex('settings').insert({
            key: 'userTemplate',
            value: user_template
        }),
        knex('settings').insert({
            key: 'newTenantTemplate',
            value: tenant_settings
        }),
        knex('settings').insert({
            key: "notifyOnNewsletter",
            value:  {"emails" : ["kimberly.wilson@smartdatasystems.net"]}
        }),
        knex('settings').insert({
            key: "formIcons",
            value: {
                "icons":[
                    'fa-ticket',
                    'fa-clock-o',
                    'fa-balance-scale',
                    'fa-group',
                    'fa-flag',
                    'fa-legal',
                    'fa-book',
                    'fa-shopping-cart',
                    'fa-truck',
                    'fa-university',
                    'fa-heartbeat',
                    'fa-calculator',
                    'fa-file-text',
                    'fa-comments-o',
                    'fa-user-md',
                    'fa-exclamation-triangle',
                    'fa-hospital-o',
                    'fa-calendar',
                    'fa-laptop',
                    'fa-money',
                    'fa-tag',
                    'fa-pencil',
                    'fa-trophy',
                    'fa-industry',
                    'fa-flask',
                    'fa-bug'
                ]
            }
        })
    )
        .then(function () {
            let results = {};
            results.tenants = Promise.all([
                seedUtility.addTenant(knex, 'Smart Data Systems')
            ]);
            return Promise.props(results);
        })
        .then(function (results){
                results.users = Promise.all([
                    seedUtility.addUser(knex, 'superadmin', 'supportticket@smartdatasystems.net','!QAZ2wsx', [{id: results.tenants[0].tenantId, role: results.tenants[0].adminRoleId}], true),
                    seedUtility.addUser(knex, 'David Benson', 'david.benson@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].adminRoleId}], true),
                    seedUtility.addUser(knex, 'Bob Hodson', 'bob.hodson@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].userRoleId}], false),
                    seedUtility.addUser(knex, 'Ravi Manchala', 'ravi.manchala@smartdatasystems.net','p@ssW0rd', [{id: results.tenants[0].tenantId, role: results.tenants[0].userRoleId}], false),
                    seedUtility.addUser(knex, 'Stefan Kyntchev', 'stefan.kyntchev@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].userRoleId}], false),
                    seedUtility.addUser(knex, 'Kim Wilson', 'kimberly.wilson@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].adminRoleId}], false),
                    seedUtility.addUser(knex, 'Sivan Ch', 'sivan.c@smartdataglobal.in','P@ssw0rd', [{id: results.tenants[0].tenantId, role: results.tenants[0].adminRoleId}],true)
                ]);

            return Promise.props(results);

        }).then(function (results){
            if(env === 'dev'){
                results.tickets = Promise.all([
                    seedUtility.addTicket(knex, results.tenants[0].tenantId, results.tenants[0].formId, results.tenants[0].closedId, results.users[0], 'Database Seeded Successfully', 'The database has been successfully seeded.')
                ]);
            }else{
                results.tickets = Promise.all([
                    seedUtility.addTicket(knex, results.tenants[0].tenantId, results.tenants[0].formId, results.tenants[0].closedId, results.users[0], 'Database Seeded Successfully', 'The database has been successfully seeded.')
                ]);
            }
            return Promise.props(results);
        });
};
