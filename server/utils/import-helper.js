"use strict";

let Promise = require("bluebird"),
    _ = require('lodash'),
    moment = require('moment'),
    through = require('through');

module.exports = class ImportHelper{
    constructor (users, lookupData, formId){
        this.users = users;

        if(lookupData){
            this.statusTypes = lookupData.statusTypes;
            this.roles = lookupData.tenant.toJSON().roles;
            this.defaultRole = _.find(lookupData.tenant.toJSON().roles, {'default': true}).id;
            this.userTemplate = lookupData.tenant.toJSON().userTemplate;
        }

        if (formId) {
            this.form = _.find(lookupData.tenant.toJSON().forms, {id: formId});
            this.defaultStatusType = _.result(this.form.statusTypes.statusIds[0], "id");
            this.availableStatus = _.map(this.form.statusTypes.statusIds, "id");
        }
    }

    // parse a user from an email or user name
    lookupUser(user, def) {
        if (def === undefined){
            throw new Error("A default is required for lookupUser");
        }

        if (!user) {
            return def;
        }

        user = user.toLowerCase().trim();
        let result = _.find(this.users, u =>
             (u.email.toLowerCase().trim() === user || u.name.toLowerCase().trim() === user)
        );

        return result ? result.id : def;
    }

    // parse a status from a string label or id
    lookupStatus(status, def) {
        if (!this.form) {
            throw new Error('Form must be specified');
        }

        if (!status) {
            return def || this.defaultStatusType;
        }
        status = status.toLowerCase().trim();
        let result = _.find(this.statusTypes, s => (s.name.toLowerCase().trim() === status));
        return result && _.includes(this.availableStatus, result.id) ? result.id : this.defaultStatusType;
    }

    // parse a role from a string label or id
    lookupRole(role, def){
        def = def || this.defaultRole;

        if (!role) {
            return def;
        }

        role = role.toLowerCase().trim();
        let result = _.find(this.roles, r =>
                (r.name.toLowerCase().trim() === role || r.id.toString() === role)
        );
        return result ? result.id : def;
    }

    // parse a date from a string
    lookupDate(date, def){
        def = def || new Date();
        moment.createFromInputFallback = function(config) {
            config._d = new Date(config._i);
        };

        let m = moment(date);

        return m.isValid() ? m.toDate() : def;
    }

    // If a form is passed in to the constructor, will filter based on form controls, otherwise will filter based on user controls.
    // Case insensitive.
    lookupMetadata(object) {
        let result = {};

        _.each(this.form ? this.form.ticketTemplate.controls : this.userTemplate.controls, template => {
            let item = _.find(object, (i, k) => (k.toLowerCase().trim() === template.name.toLowerCase().trim()));

            if (typeof item === 'string' && template.type === 'checkboxlist') {
                result[template.name] = item.split('\n');
            } else {
                result[template.name] = item;
            }
        });

        return {
            controls: result,
            importKey: object.id
        };
    }


    // Returns a string error message for any failed imports
    static getErrorMessage (error) {
        console.log(error);
        if (error.output && error.output.payload && error.output.payload.message){
            return error.output.payload.message;
        }else if (error.message){
            return error.message;
        }else{
            return error;
        }
    }


    // convert a csv document to json format
    static CSVtoJSON (){
        let columns;
        return through(function write(record) {
            console.log('CSV To JSON');
            let ticket = {
                comments: [],
                notes: [],
                attachments: []
            };
            let comment;
            let attachment;
            let note;

            if (columns) {
                for (let i = 0; i < record.length; i++){
                    if (columns[i] === "comment") {
                        if (comment && comment.content){
                            ticket.comments.push(comment);
                            comment = {};
                        }
                        comment = comment || {};
                        comment.content = record[i];
                    }else if (columns[i].startsWith("comment")) {
                        comment = comment || {};
                        comment[columns[i].substr(8)] = record[i];

                    }else if (columns[i] === "attachment"){
                        if (attachment && attachment.content){
                            ticket.attachments.push(attachment);
                            attachment = {};
                        }
                        attachment = attachment || {};
                        attachment.filename = record[i];
                    }else if (columns[i].startsWith("attachment")) {
                        attachment = attachment || {};
                        attachment[columns[i].substr(11)] = record[i];

                    }else if (columns[i] === "note"){
                        if (note && note.content){
                            ticket.notes.push(note);
                            note = {};
                        }
                        note = note || {};
                        note.content = record[i];
                    }else if (columns[i].startsWith("note")){
                        note = note || {};
                        note[columns[i].substr(5)] = record[i];
                    }else{
                        ticket[columns[i]] = record[i];
                    }
                }
                if (comment && comment.content){
                    ticket.comments.push(comment);
                }
                if (attachment && attachment.content){
                    ticket.attachments.push(attachment);
                }
                if (note && note.content){
                    ticket.notes.push(note);
                }
                this.queue(ticket);
            }else{
                // first line
                columns = record;
            }
        });
    }


    // stream transform to run "insert(record)" function
    // will first check that matchId(id) and matchShadowId(id) do not return any items
    // then will run insert.

    static addTransform(insert, matchId, matchShadowId){

        return through(function write(record) {
            this.pause();

            // when we export, our internal ticket ids should be prefixed with smartTicket_
            // We don't want to have collisions with all the random integer ids coming in.
            if (matchId && record.id && record.id.startsWith('smartTicket_')){ // ignore duplicates
                console.log('matched item');
                matchId(parseInt(record.id.substr(12), 10))
                    .then(item => item.length ? {success: false, reason: 'Item Already Exists'} : insert(record))
                    .then(result => {
                        this.queue(result);
                        this.resume();
                    },result => {
                        this.queue(result);
                        this.resume();
                    });

            }else if(matchShadowId && record.id){
                console.log('matched item');
                    matchShadowId(record.id)
                        .then(item => item.length ? {success: false, reason: 'Item Already Exists'} : insert(record))
                        .then(result => {
                            this.queue(result);
                            this.resume();
                        },result => {
                            this.queue(result);
                            this.resume();
                        });

            }else{
                insert(record).then(result => {
                    this.queue(result);
                    this.resume();
                },result => {
                    this.queue(result);
                    this.resume();
                });
            }
        });
    }

};
