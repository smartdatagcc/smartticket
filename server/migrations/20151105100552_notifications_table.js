
exports.up = function(knex, Promise) {
    "use strict";
    return knex.schema
        .createTable('notifications', function (t) {
            t.increments('id').primary();
            t.string('url');
            t.string('message');
            t.string('icon');
            t.integer('tenant_id').references('tenants.id');
            t.integer('user_id').references('users.id');
            t.timestamps();
        });
};

exports.down = function(knex, Promise) {
    "use strict";
    return knex.schema
        .dropTable('notifications');
  
};
