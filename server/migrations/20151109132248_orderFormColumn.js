"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.integer("order");
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.dropColumn("order");
        });
};
