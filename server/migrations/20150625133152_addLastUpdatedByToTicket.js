'use strict';


exports.up = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.integer("updatedBy").references('users.id');
        });
};

exports.down = function (knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.dropColumn('updatedBy');
        });

};

