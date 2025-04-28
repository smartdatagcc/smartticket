(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'tenants',
            hasTimestamps: true,
            users: function () {
                return this.belongsToMany('User');
            },
            forms: function () {
                return this.hasMany('Form');
            },
            roles: function () {
                return this.hasMany("Role");
            },
            supportTickets: function () {
                return this.hasMany("SupportTicket", "tenantId");
            },
            statusTypes: function () {
                return this.hasMany("StatusType", "tenantId");
            }
        });
    };
})();
