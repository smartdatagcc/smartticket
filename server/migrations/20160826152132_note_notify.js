"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('notes', function (t) {
            t.string("notifyUsers");
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('notes', function (t) {
            t.dropColumn("notifyUsers");
        });
};
