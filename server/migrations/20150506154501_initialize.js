'use strict';

exports.up = function (knex, Promise) {
    return knex.schema
        .createTable('tenants', function (t) {
            t.increments('id').primary();
            t.string('name', 100);
            t.json('ticketTemplate', true);
            t.json('tenantSettings', true);
            t.boolean('deleted').defaultTo(false);
            t.timestamps();
        })
        .raw('ALTER SEQUENCE tenants_id_seq RESTART WITH 1000')
        .createTable('roles', function (t) {
            t.increments('id').primary();
            t.string('name', 100);
            t.boolean('canEdit');
            t.boolean('default');
            t.json('permissions', true);
            t.integer('tenant_id').references('tenants.id');
            t.timestamps();
        })
        .raw('ALTER SEQUENCE roles_id_seq RESTART WITH 1000')
        .createTable('users', function (t) {
            t.increments('id').primary();
            t.string('name', 100);
            t.string('email', 100);
            t.string('password', 100);
            t.boolean('su').defaultTo(false);
            t.boolean('deleted').notNullable().defaultTo(false);
            t.timestamps();
        })
        .raw('ALTER SEQUENCE users_id_seq RESTART WITH 1000')
        .createTable('statusTypes', function (t) {
            t.increments('id').primary();
            t.string("name");
            t.integer("order");
            t.integer("createdBy");
            t.boolean("isWorkFlow");
            t.string("workflowActionName");
            t.string("color");
            t.integer('tenantId').references('tenants.id');
            t.timestamps();
        })
        .raw('ALTER SEQUENCE "statusTypes_id_seq" RESTART WITH 1000')
        .createTable('supportTickets', function (t) {
            t.increments('id').primary();
            t.string("subject");
            t.integer("createdBy").references('users.id');
            t.integer("assignedTo").references('users.id');
            t.integer('tenantId').references('tenants.id');
            t.integer("statusType").references('statusTypes.id');
            t.json("metadata", true);
            t.boolean('deleted').notNullable().defaultTo(false);
            t.timestamps();
        })
        .raw('ALTER SEQUENCE "supportTickets_id_seq" RESTART WITH 1000')
        .createTable('notes', function (t) {
            t.increments('id').primary();
            t.text("content");
            t.integer("createdBy").references('users.id');
            t.integer('supportTicketId').references('supportTickets.id');
            t.boolean('deleted').notNullable().defaultTo(false);
            t.timestamps();
        })
        .raw('ALTER SEQUENCE notes_id_seq RESTART WITH 1000')
        .createTable('comments', function (t) {
            t.increments('id').primary();
            t.text("content");
            t.integer("createdBy").references('users.id');
            t.integer('supportTicketId').references('supportTickets.id');
            t.boolean('deleted').notNullable().defaultTo(false);
            t.timestamps();
        })
        .raw('ALTER SEQUENCE comments_id_seq RESTART WITH 1000')
        .createTable('attachments', function (t) {
            t.increments('id').primary();
            t.string("filename");
            t.string("bucket");
            t.string("eTag");
            t.integer("createdBy").references('users.id');
            t.integer('commentId').references('comments.id');
            t.boolean('deleted').notNullable().defaultTo(false);
            t.timestamps();
        })
        .raw('ALTER SEQUENCE attachments_id_seq RESTART WITH 1000')
        .createTable('tenants_users', function(t){
            t.increments('id').primary();
            t.integer("tenant_id").references('tenants.id');
            t.integer("user_id").references('users.id');
        })
        .raw('ALTER SEQUENCE tenants_users_id_seq RESTART WITH 1000')
        .createTable('users_roles', function(t){
            t.increments('id').primary();
            t.integer("user_id").references('users.id');
            t.integer("role_id").references('roles.id');
        })
        .raw('ALTER SEQUENCE users_roles_id_seq RESTART WITH 1000')
        .createTable('settings', function(t){
            t.string("key").primary();
            t.json("value", true);
        })
        .createTable('newsletters', function (t) {
            t.string("email").primary();
            t.string("firstName");
            t.string("lastName");
            t.string("company");
            t.string("employees");
            t.string("customers");
            t.boolean("beta");
            t.string("comments",2048);
            t.timestamps();
        })
        .createTable('full_log', function (t){
            t.bigIncrements('id').primary();
            t.string('verb', 10);
            t.string('url', 512);
            t.text('data');
            t.integer('user_id');
            t.string('from');
            t.timestamps();
        })
        .createTable('registration', function (t) {
            t.increments('id').primary();
            t.integer("tenant_id").references('tenants.id');
            t.integer("createdBy").references('users.id');
            t.string("email");
            t.timestamps();
        });
};

exports.down = function (knex, Promise) {
    return knex.schema
        .dropTable('tenants_users')
        .dropTable('users_roles')
        .dropTable('notes')
        .dropTable('attachments')
        .dropTable('comments')
        .dropTable('supportTickets')
        .dropTable('statusTypes')
        .dropTable('registration')
        .dropTable('full_log')
        .dropTable('users')
        .dropTable('roles')
        .dropTable('tenants')
        .dropTable('settings')
        .dropTable('newsletters')

    ;
};
