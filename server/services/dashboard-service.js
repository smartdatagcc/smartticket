"use strict";
let Promise = require('bluebird'),
    uuid = require('node-uuid'),
    moment = require('moment'),
    _ = require('lodash'),
    PermissionsService = require("./permissions-service.js"),
    Base = require("./base.js");

class Dashboard extends Base {
    constructor(request){
        super(request);
        this.request = request;
        this.StatusType = this.getModel('StatusType');
        this.Tenant = this.getModel('Tenant');
        this.Form = this.getModel('StatusType');
    }

    getTenantDashboard (tenantId) {
        let credentials = this.credentials;
        return Promise.join(
            new PermissionsService(this.credentials).allowed("CanManageTickets", tenantId) &&
                this.knex('supportTickets')
                    .where('deleted', false)
                    .andWhere('archived', false)
                    .andWhere("supportTickets.tenantId", tenantId)
                    .groupBy('formId', 'statusType')
                    .select('formId', 'statusType', this.$$('count(id)'))
                    .tap(),
                // get my tickets
                this.knex('supportTickets')
                    .where('deleted', false)
                    .andWhere('archived', false)
                    .andWhere("supportTickets.tenantId", tenantId)
                    .andWhere(queryBuilder => {
                        return queryBuilder.where('createdBy', this.credentials.id)
                            .orWhere('assignedTo', this.credentials.id);
                    })
                    .groupBy('formId', 'statusType')
                    .select('formId', 'statusType', this.$$('count(id)'))
                    .tap(),
                //get all deleted ticket count
                this.knex('supportTickets')
                    .where('deleted', true)
                    .andWhere('archived', false)
                    .andWhere("supportTickets.tenantId", tenantId)
                    .groupBy('formId', 'statusType')
                    .select('formId', 'statusType', this.$$('count(id)'))
                    .tap(),
                //get my deleted ticket count
                this.knex('supportTickets')
                    .where('deleted', true)
                    .andWhere('archived', false)
                    .andWhere("supportTickets.tenantId", tenantId)
                    .andWhere(queryBuilder => {
                        return queryBuilder.where('createdBy', this.credentials.id)
                            .orWhere('assignedTo', this.credentials.id);
                    })
                    .groupBy('formId', 'statusType')
                    .select('formId', 'statusType', this.$$('count(id)'))
                    .tap(),
                //get all archive ticket count
                this.knex('supportTickets')
                    .where('archived', true)
                    .andWhere('deleted', false)
                    .andWhere("supportTickets.tenantId", tenantId)
                    .groupBy('formId', 'statusType')
                    .select('formId', 'statusType', this.$$('count(id)'))
                    .tap(),
                //get my archive ticket count
                this.knex('supportTickets')
                    .where('archived', true)
                    .andWhere('deleted', false)
                    .andWhere("supportTickets.tenantId", tenantId)
                    .andWhere(queryBuilder => {
                        return queryBuilder.where('createdBy', this.credentials.id)
                            .orWhere('assignedTo', this.credentials.id);
                    })
                    .groupBy('formId', 'statusType')
                    .select('formId', 'statusType', this.$$('count(id)'))
                    .tap(),

                 (allCounts, myCounts, allDeletedTicketCounts, myDeletedTicketCounts, allArchivedCounts, myArchivedCounts, status) => {
                    let results = {};

                     myCounts.forEach(c => {
                        results[c.formId] = results[c.formId] || {};
                        results[c.formId][c.statusType] = results[c.formId][c.statusType] || {};
                        results[c.formId][c.statusType].myCount = parseInt(c.count, 10);
                    });

                    if (allCounts) {
                        allCounts.forEach((c) =>  {
                            results[c.formId] = results[c.formId] || {};
                            results[c.formId][c.statusType] = results[c.formId][c.statusType] || {};
                            results[c.formId][c.statusType].allCount = parseInt(c.count, 10);
                        });
                    }

                     if(allDeletedTicketCounts) {
                         allDeletedTicketCounts.forEach((c) => {
                             results[c.formId] = results[c.formId] || {};
                             results[c.formId][c.statusType] = results[c.formId][c.statusType] || {};
                             results[c.formId][c.statusType].allDeletedCount = parseInt(c.count, 10);
                         });
                     }

                    if(myDeletedTicketCounts) {
                        myDeletedTicketCounts.forEach((c) => {
                            results[c.formId] = results[c.formId] || {};
                            results[c.formId][c.statusType] = results[c.formId][c.statusType] || {};
                            results[c.formId][c.statusType].myDeletedCount = parseInt(c.count, 10);
                        });
                    }

                     if(allArchivedCounts) {
                         allArchivedCounts.forEach((c) => {
                             results[c.formId] = results[c.formId] || {};
                             results[c.formId][c.statusType] = results[c.formId][c.statusType] || {};
                             results[c.formId][c.statusType].allArchivedCount = parseInt(c.count, 10);
                         });
                     }

                     if(myArchivedCounts) {
                         myArchivedCounts.forEach((c) => {
                             results[c.formId] = results[c.formId] || {};
                             results[c.formId][c.statusType] = results[c.formId][c.statusType] || {};
                             results[c.formId][c.statusType].myArchivedCount = parseInt(c.count, 10);
                         });
                     }

                    return results;
                }
        );
    }

    getDashboard () {
        let tenantIds = _.map(this.credentials.tenants, 'id') || [];
        console.log(this.knex.raw)
        return Promise.join(
            this.knex('supportTickets')
                .where('deleted', false).andWhere('archived', false).andWhere(queryBuilder => {
                    return queryBuilder.where('createdBy', this.credentials.id)
                        .orWhere('assignedTo', this.credentials.id);
                })
                .groupBy('tenantId', 'statusType')
                .select('tenantId', 'statusType', this.knex.raw('count(id)'))
                .then(),
            new this.StatusType()
                .where('tenantId', 'in', tenantIds)
                .fetchAll(),
            new this.Tenant()
                .where('id', 'in', tenantIds)
                .fetchAll(),
            (counts, status, tenant) => {
                let results = {};

                tenant.forEach(t => {
                    results[t.get('id')] = {
                        status: {},
                        name: t.get('name'),
                        logoUrl: t.get('tenantSettings').settings.logoUrl,
                        themeColor: t.get('tenantSettings').settings.themeColor
                    };
                });

                status.forEach(s => {
                    if (results[s.get('tenantId')]) {
                        results[s.get('tenantId')].status[s.id] = results[s.get('tenantId')][s.id] || {};
                        results[s.get('tenantId')].status[s.id].name = s.get('name');
                        results[s.get('tenantId')].status[s.id].order = s.get('order');
                        results[s.get('tenantId')].status[s.id].color = s.get('color');
                        results[s.get('tenantId')].status[s.id].myCount = 0;
                        results[s.get('tenantId')].status[s.id].allCount = 0;
                    }
                });

                counts.forEach(c => {
                    if (results[c.tenantId]) {
                        results[c.tenantId].status[c.statusType].myCount = parseInt(c.count, 10);
                    }
                });

                return results;
            }
        );
}
}


module.exports = Dashboard;

