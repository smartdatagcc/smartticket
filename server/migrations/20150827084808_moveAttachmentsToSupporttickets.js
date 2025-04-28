"use strict";
let Promise = require('bluebird');
exports.up = function(knex, Promise) {
    return knex.transaction(function(trx) {
        return knex.schema
            .table('attachments', function (t) {
                //t.dropColumn('commentId');
                t.integer('supportTicketId').references('supportTickets.id');
            }).then(function () {
                return knex.select('commentId').from('attachments').
                then(function (rows) {
                    const commentIds = rows.map(row => row.commentId);
                    return knex.select('*').from('comments').whereIn('id', commentIds)
                        .then(function (comments) {
                            return Promise && Promise.each(comments, function (comment) {
                                return knex('attachments')
                                    .where('commentId', '=', comment.id)
                                    .update({
                                        supportTicketId: comment.supportTicketId
                                    });
                            }).then(function(){
                                return knex.schema
                                    .table('attachments', function (t) {
                                        t.dropForeign('commentId');
                                        t.dropColumn('commentId');
                                    });
                            });
                        });
                });
            });
    });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('attachments', function (t) {
            t.dropColumn("supportTicketId");
        })
        .table('attachments', function(t) {
            t.integer('commentId').references('comments.id');
        });
};

