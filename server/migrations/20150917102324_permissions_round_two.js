
exports.up = function(knex, Promise) {
    Promise = require('bluebird');
    "use strict";
    let admin_permissions = {
        "access": {
            "CanViewAdminPages": true,
            "CanManageTickets" : true,
            "CanEditNotes" : true,
            "CanViewNotes": true
        }
    };

    let support_permissions = {
        "access": {
            "CanViewAdminPages": false,
            "CanManageTickets" : true,
            "CanEditNotes" : false,
            "CanViewNotes": true
        }
    };

    let user_permissions = {
        "access": {
            "CanViewAdminPages": false,
            "CanManageTickets" : false,
            "CanEditNotes" : false,
            "CanViewNotes": false
        }
    };
    return Promise && Promise.join(
        knex('settings').where({key: 'adminPermissions'})
            .update({
            value: admin_permissions
        }),
        knex('settings').where({key: 'userPermissions'})
            .update({
            value: user_permissions
        }),
        knex('settings').where({key: 'supportUserPermissions'})
            .update({
            value: support_permissions
        })
    );
};

exports.down = function(knex, Promise) {
    "use strict";
    let admin_permissions = {
        "access": {
            "CanViewAdminPages": {"name": "Can View Admin Pages", "current": "Manage", "rights": ["Manage", "Denied"]},
            "CanManageTickets" : {"name": "Can Manage All Tickets", "current": "Manage", "rights": ["Manage", "Denied"]},
            "NotesPermissions" : {"name": "Administrative Notes", "current": "Manage", "rights": ["View", "Manage", "Denied"]},
            "CanCreateTickets" : {"name": "Can Create Tickets", "current": "Manage", "rights": ["Manage", "Denied"]}
        }
    };

    let support_permissions = {
        "access": {
            "CanViewAdminPages": {"name": "Can View Admin Pages", "current": "Denied", "rights": ["Manage", "Denied"]},
            "CanManageTickets" : {"name": "Can Manage All Tickets", "current": "Manage", "rights": ["Manage", "Denied"]},
            "NotesPermissions" : {"name": "Administrative Notes", "current": "View", "rights": ["View", "Manage", "Denied"]},
            "CanCreateTickets" : {"name": "Can Create Tickets", "current": "Manage", "rights": ["Manage", "Denied"]}
        }
    };

    let user_permissions = {
        "access": {
            "CanViewAdminPages": {"name": "Can View Admin Pages", "current": "Denied", "rights": ["Manage", "Denied"]},
            "CanManageTickets" : {"name": "Can Manage All Tickets", "current": "Denied", "rights": ["Manage", "Denied"]},
            "NotesPermissions" : {"name": "Administrative Notes", "current": "Denied", "rights": ["View", "Manage", "Denied"]},
            "CanCreateTickets" : {"name": "Can Create Tickets", "current": "Manage", "rights": ["Manage", "Denied"]}
        }
    };

    return Promise.join(
        knex('settings').where({key: 'adminPermissions'})
            .update({
                value: admin_permissions
            }),
        knex('settings').where({key: 'userPermissions'})
            .update({
                value: user_permissions
            }),
        knex('settings').where({key: 'supportUserPermissions'})
            .update({
                value: support_permissions
            })
    );
  
};
