'use strict';

exports.up = function(knex, Promise) {
    return knex.schema
        .table('pendingAddUsers', function (t) {
            t.string('registrationToken');
            t.string('name', 100);
            t.string('password', 100);
            t.bool("hasRegistered").defaultTo(false);
        });
};

exports.down = function (knex, Promise) {
    return knex.schema
        .table('pendingAddUsers', function (t) {
            t.dropColumn('registrationToken');
            t.dropColumn('name');
            t.dropColumn('password');
            t.dropColumn("hasRegistered");
        });
};

