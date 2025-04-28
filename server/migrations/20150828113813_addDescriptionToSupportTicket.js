'use strict';

exports.up = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.text('description', 'longtext');
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('supportTickets', function (t) {
            t.dropColumn("description");
        });
};
