'use strict';


exports.up = function(knex, Promise) {
    return knex.schema
        .table('comments', function (t) {
            t.bool("system").defaultTo(false);
        });
};

exports.down = function (knex, Promise) {
    return knex.schema
        .table('comments', function (t) {
            t.dropColumn("system");
        });
};

