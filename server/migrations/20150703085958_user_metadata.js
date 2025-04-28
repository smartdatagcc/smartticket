'use strict';

exports.up = function(knex, Promise) {
    return knex.schema
        .table('pendingAddUsers', function (t) {
            t.json("user_metadata", true);
        })
        .table('tenants_users', function (t) {
            t.json("user_metadata", true);
        })
        .table('tenants', function (t) {
            t.json("userTemplate", true);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('pendingAddUsers', function (t) {
            t.dropColumn("user_metadata");
        })
        .table('tenants_users', function (t) {
            t.dropColumn("user_metadata");
        })
        .table('tenants', function (t) {
            t.json("userTemplate");
        });
};
