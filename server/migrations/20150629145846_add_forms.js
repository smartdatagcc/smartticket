exports.up = function(knex, Promise) {
    "use strict";
    return knex.schema
        .createTable('forms', function (t) {
            t.increments('id').primary();
            t.string('name');
            t.json('ticketTemplate', true);
            t.json('statusTypes', true);
            t.integer('tenant_id').references('tenants.id');
            t.timestamps();
        });
};

exports.down = function(knex, Promise) {
    "use strict";
    return knex.schema
        .dropTable('forms');
};
