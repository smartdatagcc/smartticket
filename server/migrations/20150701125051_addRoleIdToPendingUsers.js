'use strict';


exports.up = function(knex, Promise) {
    return knex.schema
        .table('pendingAddUsers', function (t) {
            t.integer("role_id");
        });
};

exports.down = function (knex, Promise) {
    return knex.schema
        .table('pendingAddUsers', function (t) {
            t.dropColumn('role_id');
        });
};

