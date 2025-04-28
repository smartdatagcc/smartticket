"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.string('color').defaultTo('#1ABC9C');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.dropColumn("color");
        });
};
