"use strict";

exports.up = function(knex, Promise) {
    Promise = require('bluebird');
    return knex('settings')
        .where('key', '=', 'adminPermissions')
        .orWhere('key', '=', 'userPermissions')
        .orWhere('key', '=', 'supportUserPermissions')
        .select('*').then(function(permissions){
            return Promise && Promise.each(permissions, function(permission){
                permission.value.access.CanEditTickets = true;

                return knex('settings')
                    .where('key', '=', permission.key)
                    .update({
                        value: permission.value
                    });
            });
    }).then(function(){
        return knex('roles').select('*').then(function (result) {
            return Promise && Promise.each(result, function (role) {
                role.permissions.access.CanEditTickets = true;

                return knex('roles')
                    .where('id', '=', role.id)
                    .update({
                        permissions: role.permissions
                    });

            });
        });
    });
};

exports.down = function(knex, Promise) {
    return knex('settings')
        .where('key', '=', 'adminPermissions')
        .orWhere('key', '=', 'userPermissions')
        .orWhere('key', '=', 'supportUserPermissions')
        .select('*').then(function(permissions){
            return Promise.each(permissions, function(permission){
                delete permission.value.access.CanEditTickets;

                return knex('settings')
                    .where('key', '=', permission.key)
                    .update({
                        value: permission.value
                    });
            });
        }).then(function(){
            return knex('roles').select('*').then(function (result) {
                return Promise.each(result, function (role) {
                    delete role.permissions.access.CanEditTickets;

                    return knex('roles')
                        .where('id', '=', role.id)
                        .update({
                            permissions: role.permissions
                        });

            });
        });
    });
};
