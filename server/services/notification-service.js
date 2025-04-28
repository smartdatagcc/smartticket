"use strict";

let common         = require('../common'),
    config         = common.config(),
    Promise = require("bluebird"),
    _ = require('lodash'),
    Base = require('./base'),
    EmailService = require("./send-email-service.js");

module.exports = class NotificationService extends Base {
    constructor(request, tenantId) {
        super(request);
        this.tenantId = tenantId || request.params.tenantId;
        this.Form = this.getModel('Form');
        this.Notification = this.getModel('Notification');
        this.io = request.server.plugins['hapi-io'].io;


        this.defaultNotifications = {
            commentEmail: true,
            commentNotify: true,
            updateEmail: true,
            updateNotify: true,
            newEmail: true,
            newNotify: true,
            noteEmail: true,
            noteNotify: true
        };
    }

    clearNotifications(url){
        if (url){
            return new this.Notification().where({url: url, user_id: this.credentials.id, tenant_id: this.tenantId}).destroy();
        }else{
            console.log('no url');
            return new this.Notification().where({user_id: this.credentials.id, tenant_id: this.tenantId}).destroy();
        }
    }

    getNotifications(){
        return new this.Notification().where({user_id: this.credentials.id, tenant_id: this.tenantId}).query(qb => qb.orderBy('created_at', 'desc')).fetchAll();
    }

    addNotification(userId, message, url, icon){
        return new this.Notification()
            .where({ url: url, user_id: userId, tenant_id: this.tenantId }).fetch()
            .then(previous => {
                if (previous) {
                    new this.Notification().query(qb => { qb.where({ id: previous.id }); }).destroy();
                }
            })
            .catch(err =>
                console.log(err))
            .then(() =>
                new this.Notification({
                    tenant_id: this.tenantId,
                    user_id: userId,
                    message: message,
                    url: url.toLowerCase(),
                    icon: icon || 'fa-info-circle'
                }).save())
            .then(notification => {
            this.io.sockets.in('/user_' + userId).emit('notification', notification);
        });
    }

    getFormUsers(formId, users){
        if (!_.isArray(users)){
            users = [users];
        }
        users = users.filter(u => u && u.id);

        // Todo - clean up the database tables - we might need to add a json item to roles
        return Promise.join(
            this.knex('users_roles')
                .innerJoin('tenants_users', k => k.on('tenants_users.user_id', 'users_roles.user_id').andOn('tenants_users.tenant_id', this.tenantId))
                .innerJoin('roles', k => k.on('roles.id', 'users_roles.role_id').andOn('roles.tenant_id', this.tenantId))
                .where('tenants_users.user_id', 'in', _.map(users, 'id'))
                .select('tenants_users.user_id', 'tenants_users.user_metadata', 'users_roles.role_id', 'roles.permissions'),
            new this.Form().where({id: formId, tenant_id: this.tenantId}).fetch(),
            (userData, form) => {
                users.forEach(u => {
                    if (u) {
                        u.userData = _.find(userData, {user_id: parseInt(u.id, 10)}) || {};

                        let userNotifications = ((u.userData.user_metadata || {}).notifications || {})[formId];
                        let roleNotifications = _.find(form.get('roles').assignedRoles, {id: u.userData.role_id}) || {};
                        u.notifications = _.extend({}, this.defaultNotifications, roleNotifications.notifications, userNotifications);
                    }
                });
                return users;
            }
        );
    }

    ticketAdded (ticket, sendEmail, creator){
        var users = [
            ticket.user,
            ticket.assignedUser
        ];

        creator = creator || this.credentials || {name: 'External User'};

        return this.getFormUsers(ticket.formId, users).each(user => {
            if (user.notifications.newNotify && user.id !== creator.id){
                this.addNotification(user.id, `You have been assigned to ${ticket.form.name} #${ticket.id}`,
                    `/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}`, ticket.form.settings.details.icon);
                console.log('create ticketAdded notify ' + user.email);
            } 
            if (user.notifications.newEmail && user.id !== creator.id && sendEmail){
                console.log('send ticketAdded email ' + user.email);
                 return new EmailService().sendMailOnAssignedToTicket(user, creator, ticket);
            }
        });
    }

    ticketUpdated (ticket, sendEmail, creator){
        var users = [
            ticket.user,
            ticket.assignedUser
        ];

        creator = creator || this.credentials || {name: 'External User'};

        return this.getFormUsers(ticket.formId, users).each(user => {
            if (user.notifications.updateNotify && user.id !== creator.id){
                console.log('notify ' + user.email);
                this.addNotification(user.id, `${ticket.form.name} #${ticket.id} has been updated.`,
                    `/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}`, ticket.form.settings.details.icon);
            }
            if (user.notifications.updateEmail && user.id !== creator.id && sendEmail){
                console.log('email ' + user.email);
                new EmailService().sendMailOnUpdate(user, creator, ticket);
            }
        });
    }

    ticketComment (ticket, sendEmail, creator) {
        var users = [
            ticket.user,
            ticket.assignedUser
        ];

        creator = creator || this.credentials || {name: 'External User'};

        return this.getFormUsers(ticket.formId, users).each(user => {
            console.log(sendEmail, user.id, user.notifications);

            if (user.notifications.commentNotify && user.id !== creator.id){
                console.log('notify ' + user.email);
                this.addNotification(user.id, `${this.credentials.name} has commented on ${ticket.form.name} #${ticket.id}`,
                    `/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}`, ticket.form.settings.details.icon);
            }
            if (user.notifications.commentEmail && user.id !== creator.id && sendEmail){
                console.log('email ' + user.email);
                new EmailService().sendMailOnComment(user, creator, ticket);
            }
        });
    }
    ticketNote (ticket, sendEmail, notifyUser, creator) {
        var users = [
            ticket.user,
            ticket.assignedUser
        ];

        users = _.unionBy(users, notifyUser, 'id');

        creator = creator || this.credentials || {name: 'External User'};

        return this.getFormUsers(ticket.formId, users).each(user => {
            console.log(sendEmail, user.id, user.notifications);

            if (user.userData.permissions.access.CanViewNotes) {
                if (user.notifications.noteNotify && user.id !== creator.id) {
                    console.log('notify ' + user.email, user.id);
                    this.addNotification(user.id, `${this.credentials.name} has added a note to ${ticket.form.name} #${ticket.id}`,
                        `/${ticket.tenantId}/ticket/${ticket.formId}/${ticket.id}`, ticket.form.settings.details.icon);
                }
                if (user.notifications.noteEmail && user.id !== creator.id && sendEmail) {
                    console.log('email ' + user.email);
                    new EmailService().sendMailOnNote(user, creator, ticket);
                }
            }
        });
    }


};
