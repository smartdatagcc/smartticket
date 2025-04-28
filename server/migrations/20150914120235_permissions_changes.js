"use strict";

exports.up = function(knex,Promise) {
    Promise = require('bluebird');
    return knex('roles').select('*').then(function (result) {

        return Promise.each(result, function (role) {

            console.log(role.permissions.access);
            role.permissions.access.CanManageTickets = (role.permissions.access.CanManageTickets.current === "Manage");
            role.permissions.access.CanViewAdminPages = (role.permissions.access.CanViewAdminPages.current === "Manage");
            role.permissions.access.CanEditNotes = (role.permissions.access.NotesPermissions.current === "Manage");
            role.permissions.access.CanViewNotes = (role.permissions.access.NotesPermissions.current !== "Denied");

            delete role.permissions.access.CanCreateTickets;
            delete role.permissions.access.NotesPermissions;

            return knex('roles')
                .where('id', '=', role.id)
                .update({
                    permissions: role.permissions
                });
        });
    });
};

exports.down = function(knex, Promise) {
  
};
