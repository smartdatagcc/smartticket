"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.bool("archived").defaultTo(false);
        }).table('supportTicketHistory', function (t) {
            t.bool("archived").defaultTo(false);
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.dropColumn("archived");
        }).table('supportTicketHistory', function (t) {
            t.dropColumn("archived");
        });
};
