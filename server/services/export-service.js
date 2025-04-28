"use strict";
let Promise = require('bluebird'),
    _ = require('lodash'),
    Base = require('./base'),
    Boom = require('boom'),
    UserService = require("./user-service.js"),
    SupportTicketService = require("./support-ticket-service.js"),
    LookupData = require('./lookup-data');

module.exports = class ExportService extends Base {
    constructor(request, tenantId) {
        super(request);
        this.tenantId = tenantId || request.params.tenantId;
        this.lookupData = new LookupData(request);

    }
    exportSettings (){
        return this.lookupData.getLookupData (this.tenantId)
            .tap(lookup => lookup.tenant.load(['roles', 'forms', 'forms.responseTemplates']))
            .then(lookup => ({
                metadata: {
                  templateName: lookup.tenant.get('name'),
                  templateDescription: "",
                  created: new Date()
                },
                statusTypes: _.map(lookup.statusTypes, o =>_.pick(o, [
                    'name',
                    'workflowActionName',
                    'color'
                ])),
                userTemplate: _.map(lookup.tenant.get('userTemplate').controls, o =>_.pick(o, [
                    'name',
                    'type',
                    'label',
                    'options',
                    'required',
                    'adminOnly'
                ])),
                roles: lookup.tenant.related('roles').map(role => ({
                    name: role.get('name'),
                    "default": role.get('default'),
                    permissions: role.get('permissions').access
                })),
                tenantSettings: _.omit(lookup.tenant.get('tenantSettings').settings, ['apiKey', 'apiRefs', 'apiUser', 'apiErrorUrl', 'apiReturnUrl']),
                forms: lookup.tenant.related('forms').map(form => ({
                    name: form.get('name'),
                    ticketTemplate: _.map(form.get('ticketTemplate').controls, o =>_.pick(o, ['name', 'type', 'label', 'options', 'required', 'adminOnly'])),
                    statusTypes: _.filter(form.get('statusTypes').statusIds.map(status => ({
                           name: (_.find(lookup.statusTypes, {id: status && status.id}) || {}).name,
                           isWorkFlow: status && status.isWorkFlow
                    })), 'name'),
                    // responseTemplates: form.related('responseTemplates').first() ? form.related('responseTemplates').first().get('template').responseTemplates : [],                    
                    responseTemplates: form.related('responseTemplates').first() ? (form.related('responseTemplates').first().get('template')? form.related('responseTemplates').first().get('template').responseTemplates :[]) : [],
                    roles: _.map(form.get('roles').assignedRoles, o =>_.pick(o, ['name', 'isReadOnly', 'canBeAssigned', 'canCreateTicket', 'notifications'])),
                    settings: form.get('settings').details
                }))
            }));
    }
};
