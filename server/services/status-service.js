(function () {
    "use strict";

    let Promise = require("bluebird"),
        _ = require('lodash'),
        Base = require('./base'),
        Boom = require('boom');

    module.exports = class StatusService extends Base {
        constructor(request, tenantId) {
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.StatusType = this.getModel('StatusType');
            this.SupportTicket = this.getModel('SupportTicket');
            this.SupportTicketHistory = this.getModel('SupportTicketHistory');
        }

        getAllStatus () {
            return new this.StatusType().where({tenantId: this.tenantId}).fetchAll();
        }

        deleteStatus (id, newId) {
            return new this.StatusType().where({tenantId: this.tenantId, id})
                .fetch()
                .then(this.checkExists("StatusType does not exist."))
                .then((statusType) => {
                        if (newId){
                            return new this.StatusType().where({tenantId: this.tenantId, id: newId})
                            .fetch()
                            .then((newStatus) =>
                                this.knex('supportTickets').where('statusType', '=', statusType.id).update({statusType:  newStatus.id}))
                            .then(() => statusType);
                        }
                }).then((statusType) =>
                     statusType.destroy().catch((err) =>{
                        if (err.code === '23503'){
                            return Promise.reject(Boom.badRequest("Tickets exist which still use this status. Please ensure no tickets use this status before deleting."));
                        }
                        return Promise.reject(err);
                    })
                );
        }

        moveTickets (tenantId, formId, oldStatusId, newStatusId) {
            return Promise.join(
                new this.StatusType().where({tenantId: tenantId, id: oldStatusId}).fetch(),
                new this.StatusType().where({tenantId: tenantId, id: newStatusId}).fetch(),
                (oldStatus, newStatus) => {
                    return new this.SupportTicket().where({statusType: oldStatusId, formId: formId}).fetchAll()
                        .then(supportTickets => {
                            return Promise.each(supportTickets.models, supportTicket => {
                                return supportTicket.save({statusType: newStatus.id}, {method: 'update'})
                                    .then(updatedSupportTicket => {
                                        let difference = [{
                                            "lhs": oldStatus.get('name'),
                                            "rhs": newStatus.get('name'),
                                            "kind": "E",
                                            "path": ["status"]
                                        }
                                        ];
                                        return new this.SupportTicketHistory({
                                            supportTicketId: updatedSupportTicket.get('id'),
                                            formId: updatedSupportTicket.get('formId'),
                                            statusName: newStatus.get('name'),
                                            createdBy: updatedSupportTicket.get('createdBy'),
                                            updatedBy: updatedSupportTicket.get('updatedBy'),
                                            tenantId: updatedSupportTicket.get('tenantId'),
                                            assignedTo: updatedSupportTicket.get('assignedTo'),
                                            deleted: updatedSupportTicket.get('deleted'),
                                            metadata: updatedSupportTicket.get('metadata'),
                                            reason: "Ticket updated - status changed",
                                            changes: {diff: difference}
                                        }).save(null);
                                    })
                                    .catch(_.noop);
                            });
                        });
                }
            );
        }

        updateStatus (status) {
            return Promise.all(_.map(status, (model) =>
                new this.StatusType({id: model.id, tenantId: this.tenantId}).fetch()
                    .then((existingRole) => {
                        if (existingRole !== null) {
                            return new this.StatusType({id: model.id}).save(
                                _.pick(model, ['name', 'workflowActionName', 'color', 'updated_at']), {patch: true});
                        }
                    })
                )
            );
        }

        createStatus(model) {
            model.createdBy = this.credentials.id;
            model.tenantId = this.tenantId;
            return new this.StatusType().where({name: model.name, tenantId: model.tenantId}).fetch()
                .then(status => {
                    if (!status){
                        console.log('add status');
                        return new this.StatusType(model).save();
                    }else{
                        return status;
                    }
                });
        }
    };
})();
