exports.up = function(knex, Promise) {
    "use strict";
    return knex.schema
        .createTable('pendingAddUsers', function (t) {
            t.increments('id').primary();
            t.string('email');
            t.integer('tenant_id').references('tenants.id');
            t.timestamps();
        });
};

exports.down = function(knex, Promise) {
    "use strict";
    return knex.schema
        .dropTable('pendingAddUsers');
};
