"use strict";
exports.up = function(knex, Promise) {
    return knex.schema.table('responseTemplates', function (t) {
        t.json('template', true).defaultTo(JSON.stringify({responseTemplates:[]}));
        t.dropColumn("name");
        t.dropColumn("content");
    });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('responseTemplates', function (t) {
            t.dropColumn("template");
            t.string("name");
            t.string("content");
        });
};


