exports.up = function(knex, Promise) {
    "use strict";

    let seedUtility = require('../utils/seed-utility');

    let results = {};

    results.tenants = Promise.all([
        seedUtility.addTenant(knex, 'test-unit-tests')
    ]);

    return Promise.props(results)
        .then(function (results){

        results.users = Promise.all([
            seedUtility.addUser(knex, 'test-superadmin', 'test-superadmin@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].adminRoleId}], true),
            seedUtility.addUser(knex, 'test-admin', 'test-admin@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].adminRoleId}], false),
            seedUtility.addUser(knex, 'test-user', 'test-user@smartdatasystems.net','password', [{id: results.tenants[0].tenantId, role: results.tenants[0].userRoleId}], false)
        ]);

        return Promise.props(results);

    }).then(function (results){
            results.tickets = Promise.all([
                seedUtility.addTicket(knex, results.tenants[0].tenantId, results.tenants[0].formId, results.tenants[0].closedId, results.users[1], 'test-ticket', 'This is a unit test ticket.')
            ]);
        return Promise.props(results);
    });


};

exports.down = function(knex, Promise) {
    "use strict";

    let tenant = knex.from('tenants').select('id').where('name', 'test-unit-tests');
    let users = knex.from('tenants').select('id').whereIn('email', ['test-superadmin@smartdatasystems.net', 'test-admin@smartdatasystems.net', 'test-user@smartdatasystems.net']);

    let roles = knex.from('roles').select('id').whereIn('tenant_id', tenant);
    let usersRoles = knex.from('users_roles').select('id').whereIn('role_id', roles);
    let tenantsUsers = knex.from('tenants_users').select('id').whereIn('tenant_id', tenant);

    let pendingAddUsers = knex.from('pendingAddUsers').select('id').whereIn('tenant_id', tenant);
    let registration = knex.from('registration').select('id').whereIn('tenant_id', tenant);
    let statusTypes = knex.from('statusTypes').select('id').whereIn('tenantId', tenant);
    let forms = knex.from('forms').select('id').whereIn('tenant_id', tenant);

    let tickets = knex.from('supportTickets').select('id').whereIn('tenantId', tenant);
    let notes = knex.from('notes').select('id').whereIn('supportTicketId', tickets);
    let comments = knex.from('comments').select('id').whereIn('supportTicketId', tickets);
    let attachments = knex.from('attachments').select('id').whereIn('commentId', tickets);

    console.log('promises');
    return Promise
        .resolve(attachments.clone().del())
        .then(function (){ comments.clone().del();})
        .then(function (){ notes.clone().del();})
        .then(function (){ tickets.clone().del();})
        .then(function (){ forms.clone().del();})
        .then(function (){ statusTypes.clone().del();})
        .then(function (){ registration.clone().del();})
        .then(function (){ pendingAddUsers.clone().del();})
        .then(function (){ tenantsUsers.clone().del();})
        .then(function (){ usersRoles.clone().del();})
        .then(function (){ roles.clone().del();})
        .then(function (){ users.clone().del();})
        .then(function (){ tenant.clone().del();})
        ;
};
