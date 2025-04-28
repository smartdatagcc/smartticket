"use strict";
exports.up = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.json('settings', true).defaultTo(JSON.stringify({details:{icon:'fa-ticket'}}));
        }).then(function(){
            return knex('settings').insert({
                key: 'formIcons',
                value: {
                    "icons":[
                        'fa-ticket',
                        'fa-clock-o',
                        'fa-balance-scale',
                        'fa-group',
                        'fa-flag',
                        'fa-legal',
                        'fa-book',
                        'fa-shopping-cart',
                        'fa-truck',
                        'fa-university',
                        'fa-heartbeat',
                        'fa-calculator',
                        'fa-file-text',
                        'fa-comments-o',
                        'fa-user-md',
                        'fa-exclamation-triangle',
                        'fa-hospital-o',
                        'fa-calendar',
                        'fa-laptop',
                        'fa-money',
                        'fa-tag',
                        'fa-pencil',
                        'fa-trophy',
                        'fa-industry',
                        'fa-flask',
                        'fa-bug'
                    ]
                }
            });
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('forms', function (t) {
            t.dropColumn("settings");
        });
};
