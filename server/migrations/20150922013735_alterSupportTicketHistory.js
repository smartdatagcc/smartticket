"use strict";

exports.up = function(knex, Promise) {
    Promise = require('bluebird');
    return knex.schema
        .table('supportTicketHistory', function (t) {
            t.string("statusName");
        }).then(function () {
            return knex.select('*').from('supportTicketHistory')
                .then(function (supportTicketHistories) {
                    return Promise && Promise.each(supportTicketHistories, function (supportTicketHistory) {
                        return knex('supportTicketHistory')
                            //.innerJoin('statusTypes', 'supportTicketHistory.statusType', 'statusTypes.id')
                            .where('id', '=', supportTicketHistory.id)
                            .update({
                                statusName: knex('statusTypes').where('id', '=', supportTicketHistory.statusType).select('name')
                            });
                    })
                    .then(function () {
                        return knex.schema
                            .table('supportTicketHistory', function (t) {
                                t.dropColumn('statusType');
                            });
                    });
                });
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('supportTicketHistory', function (t) {
            t.integer("statusType").references('statusTypes.id');
        })
        .then(function () {
            return knex.select('*').from('supportTicketHistory')
                .then(function (supportTicketHistories) {
                    return Promise.each(supportTicketHistories, function (supportTicketHistory) {
                        return knex('supportTicketHistory')
                            .where('id', '=', supportTicketHistory.id)
                            .update({
                                statusType: knex('statusTypes').where('name', supportTicketHistory.statusName).select('id')
                            });
                    })
                        .then(function () {
                            return knex.schema
                                .table('supportTicketHistory', function (t) {
                                    t.dropColumn('statusName');
                                });
                        });
                });
        });
};
