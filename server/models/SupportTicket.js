(function() {
    "use strict";

    let Promise = require("bluebird"),
        moment = require('moment'),
        Sanitize = require('../utils/sanitize.js'),
        _ = require('lodash');


    module.exports = function (baseModel, bookshelf) {
        let proto = bookshelf.Model.prototype;


        return baseModel.extend({
            tableName: 'supportTickets',
            hasTimestamps: true,
            //hidden: ['deleted'],

            save: function (attrs, options) {
                if (this.__newMetadata){
                    attrs = attrs || {};
                    attrs.metadata = this.__newMetadata;
                }
                return proto.save.call(this, attrs, options);
            },
            tenant: function() {
                return this.belongsTo('Tenant', 'tenantId');
            },
            history: function () {
                return this.hasMany("SupportTicketHistory", "supportTicketId");
            },
            notes: function () {
                return this.hasMany("Note", "supportTicketId");
            },
            comments: function () {
                return this.hasMany("Comment", "supportTicketId");
            },
            attachments: function () {
                return this.hasMany("Attachment", 'supportTicketId');
            },
            statusType: function () {
                return this.belongsTo('StatusType', 'statusType');
            },
            //created by user
            user: function(){
                return this.belongsTo('User', 'createdBy');
            },
            assignedUser: function(){
                return this.belongsTo('User', 'assignedTo');
            },
            updatedByUser: function(){
                return this.belongsTo('User', 'updatedBy');
            },
            form: function () {
                return this.belongsTo('Form', 'formId');
            },
            setAutoAssignedUser: function(){
                let self = this,
                    Form = bookshelf.model('Form'),
                    User = bookshelf.model('User');
                const assignedTo = self.get('assignedTo');

                if(assignedTo){
                    //if assignedTo is set it overrides autoAssignedUser
                    return Promise.resolve(self);
                }else{
                    return Promise.resolve(this.relations.form ? this.related('form'): new Form({id:self.get('formId')}).fetch()).then(form =>{
                        form = form.toJSON ? form.toJSON() : form;
                        //check to see if autoAssignedUser is set:
                        if(form.settings.details.autoAssignedUser){
                            //validate that this user exist and is a member of this tenant...
                            return new User({id: form.settings.details.autoAssignedUser, deleted: false}).fetch({
                                withRelated:['tenants']
                            }).then((user) => {
                                if(user){
                                    user = user.toJSON();
                                    if(_.some(user.tenants, {id:self.get('tenantId')})){
                                        self.set('assignedTo', form.settings.details.autoAssignedUser);
                                    }
                                }
                                return self;
                            });
                        }

                        return self;
                    });
                }
            },
            sanitizeMetadata: function (viewAdmin){
                let self = this,
                    Form = bookshelf.model('Form');
                return Promise.resolve(this.relations.form ? this.related('form'): new Form({id:self.get('formId')}).fetch()).then(form =>{
                    form = form.toJSON ? form.toJSON() : form;
                    let metadata = self.get('metadata');

                    self.set('metadata', Sanitize.metadataFromTemplate(metadata, form.ticketTemplate, viewAdmin));
                    return self;
                });
            },
            setMetadata: function (newMetadata, isAdmin){
                let self = this,
                    Form = bookshelf.model('Form');
                return Promise.resolve(self.relations.form ? self.related('form'): new Form({id:self.get('formId')}).fetch()).then(form => {
                    form = form.toJSON ? form.toJSON() : form;
                    let metadata = self.get('metadata') || {controls: {}};

                    self.__newMetadata = Sanitize.metadataFromClient(newMetadata, metadata, form.ticketTemplate, isAdmin);

                    return self;
                });
            },
            sanitizeHistory: function(viewAdmin){
                let self = this;
                return new Promise((resolve) => {
                    if(!viewAdmin){
                        //filter out adminOnly controls since not admin
                        self.related('history').models = _.filter(self.related('history').models, (history) => {
                            let changes = history.get('changes');
                            changes.diff = _.reduce(changes.diff, (result, diff) => {
                                //is it a control
                                if(diff.control !== undefined){
                                    //we know it's a control now, is it an adminOnly control
                                    if(!diff.control.adminOnly){
                                        //not adminOnly so include it
                                        result.push(diff);
                                    }
                                }else{  //it's not a control
                                    //assigned To or statusType change if no control
                                    result.push(diff);
                                }
                                return result;
                            }, []);
                            return changes.diff && changes.diff.length > 0;
                        });
                    }
                    resolve(self);
                });
            }
        });
    };
})();
