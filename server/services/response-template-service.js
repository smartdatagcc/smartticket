"use strict";
let Promise = require("bluebird"),
    _ = require('lodash'),
    Base = require('./base.js'),
    Boom = require('boom');

module.exports = class ResponseTemplateService extends Base {
  constructor(request) {
      super(request);
      this.ResponseTemplate = this.getModel('ResponseTemplate');
  }

    get(formId){
        return new this.ResponseTemplate({formId: formId}).fetch().then(response => {
            if(response === null){
                response = {
                    formId: formId,
                    template: {
                        responseTemplates:[]
                    }
                };
            }
            return response;
        });
    }
    update(formId, template){
        return this.Bookshelf.transaction(t =>
                new this.ResponseTemplate({formId: formId}).fetch().then(responseTemplate => {
                    let responseTemplateModel = responseTemplate.toJSON();
                    responseTemplateModel.template = template;
                    responseTemplateModel.updatedBy = this.credentials.id;
                    return responseTemplate.save(responseTemplateModel, {patch: true, transacting: t});
                })

        );
    }

    add (formId, payload){
        return this.Bookshelf.transaction(t =>
                new this.ResponseTemplate({formId: formId}).fetch().then(responseTemplate => {
                    if (responseTemplate) {
                        //add to existing
                        let responseTemplateModel = responseTemplate.toJSON();
                        if (responseTemplateModel.template.responseTemplates === undefined) {
                            responseTemplateModel.template = {responseTemplates: []};
                        }

                        responseTemplateModel.template.responseTemplates.push({
                            name: payload.name,
                            content: payload.content
                        });
                        responseTemplateModel.updatedBy = this.credentials.id;
                        return responseTemplate.save(responseTemplateModel, {patch: true, transacting: t});
                    } else {
                        //new
                        let template = {
                            responseTemplates: []
                        };
                        template.responseTemplates.push({
                            name: payload.name,
                            content: payload.content
                        });

                        return new this.ResponseTemplate({
                            template: template,
                            formId: formId,
                            createdBy: this.credentials.id,
                            updatedBy: this.credentials.id
                        }).save(null, {transaction: t});
                    }
                })
        ).then(() => ({
                name: payload.name,
                content: payload.content
            }));
    }
};

