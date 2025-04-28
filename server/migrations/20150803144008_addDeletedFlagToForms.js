"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.bool("deleted").defaultTo(false);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.dropColumn("deleted");
        });
};
