"use strict";

exports.up = function(knex, Promise){
    Promise = require('bluebird');
    var subjectTemplate = {"name": "subject", "type": "text", "label": "Subject/Title", "required": true, "adminOnly": false};
    var descriptionTemplate = {"name": "description", "type": "textarea", "label": "Description", "required": true, "adminOnly": false};

    return knex.select('*').from('supportTickets').then(function (supportTickets) {
            // Statement bodies
        return Promise && Promise.each(supportTickets, function (ticket) {
                var subject = ticket.subject,
                    description = ticket.description,
                    metadata = ticket.metadata;

                if (!metadata.controls) {
                    metadata.controls = {};
                }
                metadata.controls.subject = subject;
                metadata.controls.description = description;

                return knex('supportTickets')
                    .where('id', '=', ticket.id)
                    .update({metadata: metadata});
            }).then(function () {
                return knex.select('*').from('forms').then(function (forms) {
                    return Promise.each(forms, function (form) {
                        var ticketTemplate = form.ticketTemplate;
                        if (!ticketTemplate.controls) {
                            ticketTemplate.controls = {};
                        }

                        ticketTemplate.controls.splice(0, 0, descriptionTemplate);
                        ticketTemplate.controls.splice(0, 0, subjectTemplate);

                        return knex('forms')
                            .where('id', '=', form.id)
                            .update({ticketTemplate: ticketTemplate});

                    });
                });
            }).catch(function (e) {
                    console.log(e);
                    throw e;
                });
        }).then(function(){
            return knex.schema
                .table('supportTickets', function (t) {
                    t.dropColumn("subject");
                    t.dropColumn("description");
                }).then(function(){
                    return knex.schema
                        .table('supportTicketHistory', function (t) {
                            t.dropColumn("subject");
                            t.dropColumn("description");
                        });
                });
        });

};

exports.down = function(knex, Promise) {

    return knex.schema
        .table('supportTickets', function (t) {
            t.string("subject");
            t.text("description");
        }).then(function(){
            return knex.select('*').from('supportTickets').then(function (supportTickets) {
                // Statement bodies
                return Promise.each(supportTickets, function (ticket) {
                    var subject = ticket.metadata.controls.subject;
                    var description = ticket.metadata.controls.description;

                    delete ticket.metadata.controls.subject;
                    delete ticket.metadata.controls.description;


                    return knex('supportTickets')
                        .where('id', '=', ticket.id)
                        .update({
                            subject: subject,
                            description: description,
                            metadata: ticket.metadata
                        });
                }).then(function () {
                    return knex.select('*').from('forms').then(function (forms) {
                        return Promise.each(forms, function (form) {
                            var ticketTemplate = form.ticketTemplate;
                            if (!ticketTemplate.controls) {
                                ticketTemplate.controls = {};
                            }

                            for (var i = 0; i < ticketTemplate.controls.length; i++) {
                                if(ticketTemplate.controls[i].name === 'subject' ||
                                    ticketTemplate.controls[i].name === 'description'){
                                    ticketTemplate.controls.splice(i, 1);
                                    i--; //decrement
                                }
                            }

                            return knex('forms')
                                .where('id', '=', form.id)
                                .update({ticketTemplate: ticketTemplate});

                        });
                    });
                }).catch(function (e) {
                    console.log(e);
                    throw e;
                });
            });
        }).then(function(){
            return knex.schema
                .table('supportTicketHistory', function (t) {
                    t.string("subject");
                    t.text("description");
                });
        });


};


