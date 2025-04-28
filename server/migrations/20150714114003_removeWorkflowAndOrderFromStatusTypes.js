'use strict';

exports.up = function(knex, Promise) {
    return knex.schema
    .table('statusTypes', function(t) {
        //t.dropColumn("isWorkFlow");
        //t.dropColumn("order");
    });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('statusTypes', function(t) {
            //t.boolean("isWorkFlow");
            //t.integer("order");
        });
};
