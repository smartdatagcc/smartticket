"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('tenants', function (t) {
            t.integer("tier").defaultTo(0);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('tenants', function (t) {
            t.dropColumn("tier");
        });
};
