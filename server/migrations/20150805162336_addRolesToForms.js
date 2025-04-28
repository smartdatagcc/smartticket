"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.json('roles', true).defaultTo('{"assignedRoles" : []}');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.dropColumn("roles");
        });
};
