(function () {
    "use strict";

    let Promise = require("bluebird"),
        _ = require('lodash'),
        Base = require('./base'),
        Boom = require('boom'),
        tiers = require('../utils/tiers');

    module.exports = class FormService extends Base {
        constructor(request, tenantId) {
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.Form = this.getModel("Form");
            this.StatusType = this.getModel("StatusType");
            this.Settings = this.getModel('Setting');
            this.Tenant = this.getModel('Tenant');


        }

        getFormIcons () {
            return new this.Settings({key:'formIcons'}).fetch();
        }
        getForm (formId) {
            return new this.Form().where({tenant_id: this.tenantId,  id: formId}).fetch();
        }
        deleteForm (formId) {
            return new this.Form({id: formId}).fetch()
                .then(this.checkExists("Form does not exist"))
                .then(form =>
                    this.Bookshelf.transaction(t =>
                        form.save({deleted: true}, {patch: true, transacting: t})
                        .then((deletedForm) =>
                            this.knex('supportTickets')
                                .transacting(t)
                                .where('formId', '=', deletedForm.id)
                                .update({deleted: true})
                                .then(() => deletedForm)
                        )
                    )
                );
        }
        updateForm (model) {
            model.tenant_id = this.tenantId;
            return new this.Form({id: model.id, tenant_id: this.tenantId}).fetch()
                .then((existingForm) => {
                    if (existingForm !== null) {
                        return existingForm.save(model, {patch: true});
                    }
                });
        }
        createForm (model) {
                model = {
                    name: model.name,
                    color: model.color,
                    roles: model.roles,
                    settings: model.settings,
                    tenant_id: this.tenantId,
                    ticketTemplate: model.ticketTemplate || {controls:[]}
                };
            //need to add status types - first we see if the existing status is present,
            //we do not want to duplicate status types (by name)
            //users can rename these status types, so first we'll see if the normal defaults exist:
            return Promise.join(
                new this.StatusType().where({name: "Open",   tenantId:this.tenantId }).fetch(),
                new this.StatusType().where({name: "Closed", tenantId:this.tenantId }).fetch(),
                this.knex.select('name').from('forms').where({tenant_id: this.tenantId, deleted: false}),
                new this.Tenant({id: this.tenantId}).fetch({columns: 'tier'}),
                /*
                 promises passes back each response
                 if it exists use it, otherwise, we need to create a status type
                 get the statusTypes and then save it.
                 */
                (open, closed, forms, tenant) => {
                    if (_.some(forms, {name: model.name})){
                        return Promise.reject(Boom.badRequest('Name must be unique'));
                    }else if (forms.length >= tiers[tenant.get('tier') || 0].forms){
                        return Promise.reject(Boom.forbidden('You have already reached the maximum number of forms for your tier. '));
                    }

                    return Promise.join(
                        open   || new this.StatusType({name: 'Open',   workflowActionName: 'Open',  tenantId: this.tenantId, color: '#666'}).save(),
                        closed || new this.StatusType({name: 'Closed', workflowActionName: 'Close', tenantId: this.tenantId, color: '#666'}).save(),
                        (open, closed) => {
                            let statusIds = [];
                            if (open){
                                statusIds.push({"id": open.get('id'), "isWorkFlow": true});
                            }
                            if (closed){
                                statusIds.push({"id": closed.get('id'), "isWorkFlow": true});
                            }

                            model.statusTypes = {"statusIds": statusIds};
                            return new this.Form(model).save();
                    });
                }
            );
        }
        getResponseTemplates(formId){
            return new this.Form().where({tenant_id: this.tenantId, id: formId})
                .fetch({withRelated:['responseTemplates']});
        }
        saveFormOrder(formIds){
            return this.Bookshelf.transaction(t => {
                return Promise.each(formIds, (formId, index) =>{
                    return new this.Form({id:formId}).save({order: index}, {patch:true, transaction:t});
                });
            });
        }
    };
})();
