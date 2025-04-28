"use strict";
exports.up = function(knex, Promise) {
    return knex.schema.createTable('supportTicketHistory', function (t) {
        t.increments('id').primary();
        t.string("subject");
        t.text("description");
        t.integer('supportTicketId').references('supportTickets.id');
        t.integer('formId').references('forms.id');
        t.integer("createdBy").references('users.id');
        t.integer("updatedBy").references('users.id');
        t.integer("assignedTo").references('users.id');
        t.integer('tenantId').references('tenants.id');
        t.integer("statusType").references('statusTypes.id');
        t.json("metadata", true);
        t.boolean('deleted').notNullable().defaultTo(false);
        t.string('reason');
        t.json('changes', true);
        t.timestamps();
    }).then(function(){
        return knex.schema
            .table('comments', function (t) {
                t.dropColumn("system");
            });
    });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('supportTicketHistory');
};


