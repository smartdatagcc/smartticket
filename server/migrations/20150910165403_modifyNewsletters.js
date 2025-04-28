"use strict";

exports.up = function(knex, Promise) {
    Promise = require('bluebird');
    return knex.schema
        .table('newsletters', function (t) {
            //t.dropColumn('commentId');
            t.string("name");
            t.string("description");
        }).then(function () {
            return knex.select('*').from('newsletters')
                .then(function (newsletters) {
                    return Promise && Promise.each(newsletters, function (n) {
                        return knex('newsletters')
                            .where('email', '=', newsletters.email)
                            .update({
                                name: n.firstName + " " + n.lastName
                            });
                    })
                        .then(function () {
                        return knex.schema
                            .table('newsletters', function (t) {
                                t.dropColumn('firstName');
                                t.dropColumn('lastName');
                            });
                    });
                });
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('newsletters', function(t) {
            t.string("firstName");
            t.string("lastName");
        }).then(function (){
            return knex.select('*').from('newsletters')
                .then(function (newsletters) {
                    return Promise.each(newsletters, function (n) {
                        return knex('newsletters')
                            .where('email', '=', newsletters.email)
                            .update({
                                firstName: n.name.split(' ')[0],
                                lastName: n.name.substr(n.name.indexOf(' ') + 1)
                            });
                    });
                })
                .then (function (){
                    knex.schema.table('newsletters', function (t) {
                        t.dropColumn("name");
                        t.dropColumn("description");
                    });
                });
        });

};
