"use strict";
exports.up = function(knex, Promise) {
    return knex.schema.createTable('responseTemplates', function (t) {
        t.increments('id').primary();
        t.string("name");
        t.text("content");
        t.integer('formId').references('forms.id');
        t.integer("createdBy").references('users.id');
        t.integer("updatedBy").references('users.id');
        t.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('responseTemplates');
};


