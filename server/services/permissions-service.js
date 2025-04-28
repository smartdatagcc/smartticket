"use strict";

let Promise = require("bluebird"),
    _ = require('lodash'),
    UnAuthorizedException = require("../utils/unauthorized-exception");

module.exports = class PermissionsService{
    constructor(credentials){
        this.credentials = credentials;
    }

    getPermission (role, permission) {
        return role && role.permissions.access[permission];
    }

    isInTenant (tenantId){
        if(this.credentials.su){
            return true;
        }
        return  _.some(this.credentials.roles, (role) => role.tenant_id === parseInt(tenantId, 10));
    }

    allowed (permission, tenantId){
        if (!this.credentials){
            return false;
        }
        if(this.credentials.su){
            return true;
        }
        let role = _.find(this.credentials.roles,(role) => role.tenant_id === parseInt(tenantId, 10));
        return this.getPermission(role, permission);
    }

    denied (permission, tenantId){
        return !this.allowed(permission, tenantId);
    }

    validate (hasAccess){
        if(hasAccess === true){
            return Promise.resolve(true);
        }else{
            return Promise.reject(new UnAuthorizedException());
        }
    }
};

