'use strict';


exports.up = function(knex, Promise) {
    return knex.schema
        .table('users', function (t) {
            t.string('resetPasswordToken');
            t.dateTime('resetPasswordExpires');
        });
};

exports.down = function (knex, Promise) {
    return knex.schema
        .table('users', function (t) {
            t.dropColumn('resetPasswordToken');
            t.dropColumn('resetPasswordExpires');
        });
};

