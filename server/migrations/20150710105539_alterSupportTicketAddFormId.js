'use strict';

exports.up = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.integer('formId').references('forms.id');
        })
        .table('tenants', function(t) {
            t.dropColumn('ticketTemplate');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.dropColumn("formId");
        }).table('tenants', function(t) {
            t.json('ticketTemplate', true);
        });
};
