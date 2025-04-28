"use strict";
    let Promise = require("bluebird"),
        PermissionsService = require("../services/permissions-service.js"),
        Boom = require("boom"),
        _ = require('lodash'),
        tiers = require('../utils/tiers'),
        Base = require('./base.js');

class LookupData extends Base {
    constructor(request){
        super(request);
        this.Tenant = this.getModel('Tenant');
        this.StatusType = this.getModel('StatusType');
        this.User = this.getModel('User');
    }

    getLookupData (tenantId) {
            return Promise.join(
                new this.Tenant({id:tenantId, deleted:false})
                    .fetch({withRelated: [{
                        'forms': (qb) => qb.where('deleted', false).orderBy('order')
                }]}),
                this.StatusType.getStatusTypes(tenantId)
            ).then(item => {

                return {
                    tenant: item[0],
                    statusTypes: item[1],
                };
            });
    }

    getTenantUsers(tenantId){
        return this.knex('users')
            .join('tenants_users', 'tenants_users.user_id', 'users.id')
            .where('tenants_users.tenant_id', '=', tenantId)
            .andWhere('deleted', '!=', true)
            .select('users.*');
    }

    getUserByEmail(email, tenantId) {
        return new this.User({email: email})
        .fetch({withRelated: [
            {'tenants': (qb) => qb.where('tenants.id', '=', tenantId) }]
        });
    }

    getStatusTypes (tenantId){
        return this.StatusType.getStatusTypes(tenantId);
    }

    getStatusTypeById (statusTypeId) {
        return new this.StatusType({id:statusTypeId}).fetch();
    }

    getTenantName (tenantId){
        return new this.Tenant({id:tenantId}).fetch().then((tenant) => {
                if (tenant) {
                    return {
                        themeColor: tenant.get('tenantSettings').settings.themeColor,
                        logoUrl: tenant.get('tenantSettings').settings.logoUrl,
                        tenantName: tenant.get('name'),
                        domain: tenant.get('tenantSettings').settings.restrictedRegistrationDomain,
                        inviteOnly: tenant.get('tenantSettings').settings.registrationInviteOnly
                    };
                }else{
                    return Promise.reject(Boom.notFound());
                }
            }
        );
    }

    containsRole (tenantId, userRoles, assignedRoles){
        let roleIds = _.map(_.filter(userRoles, {tenant_id: tenantId }), 'id');
        let assignedRoleIds = _.map(assignedRoles, 'id');
        return _.intersection(assignedRoleIds, roleIds).length > 0;
    }

    isAssignedToForm (tenantId, userRoles, assignedRoles){
        let roleIds = _.map(_.filter(userRoles, {tenant_id: tenantId }), 'id');
        //let assignedRoleIds = _.map(assignedRoles, 'id');

        let canCreateTicket = false;
        _.each(assignedRoles, (assignedRole) => {
            if(_.intersection([assignedRole.id], roleIds).length > 0 && assignedRole.canCreateTicket)
            {
                canCreateTicket = true;
            }
        });
        return canCreateTicket;
    }
    getRegistrationFields (tenantId){
        return new this.Tenant({id:tenantId, deleted:false}).fetch().then((tenant) => {
            if(tenant) {
                return _.filter(tenant.get('userTemplate').controls, {adminOnly: false});
            }else{
                return null;
            }
        });
    }
    forceGetLookupData (tenantId) {
        let self = this;

        return Promise.join(
            new this.Tenant({id: tenantId, deleted: false}).fetch({
                withRelated: [{
                    'forms': (qb) => qb.where('deleted', false).orderBy('order')
                }]
            }),
            this.StatusType.getStatusTypes(tenantId),
            (tenant, statusTypes) => {
                tenant = tenant ? tenant.toJSON() : {};
                if (tenant) {
                    //make sure user has access to this form:
                    tenant.forms = _.filter(tenant.forms, (form) => {
                        if (!this.credentials
                            || self.isAssignedToForm(tenantId, this.credentials.roles, form.roles.assignedRoles)
                            || new PermissionsService(this.credentials).allowed("CanViewAdminPages", tenantId)) {
                            //while we are here...
                            if (!new PermissionsService(this.credentials).allowed("CanManageTickets", tenantId)) {
                                //filter out admin only fields from the tenant forms
                                form.ticketTemplate.controls = _.filter(form.ticketTemplate.controls, (value, key) => !value.adminOnly);
                            }
                            return form;
                        }
                    });

                    if (tenant.userTemplate && tenant.userTemplate.controls) {
                        tenant.userTemplate.controls = _.filter(tenant.userTemplate.controls, (control) => {
                            if (!new PermissionsService(this.credentials).allowed("CanManageTickets", tenantId)) {
                                return !control.adminOnly;
                            }
                            return control;
                        });
                    }

                    tenant.tier =  tiers[tenant.tier];

                    return {
                        tenant: tenant,
                        statusTypes: statusTypes
                    };
                }
            }
        );
    }
}

module.exports = LookupData;
