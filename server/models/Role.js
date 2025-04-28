(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'roles',
            hasTimestamps: true,
            tenant: function () {
                return this.belongsTo('Tenant');
            },
            user: function() {
                return this.belongsTo('User');
            },
            users: function() {
                return this.belongsToMany('User', 'users_roles', 'role_id');
            }
        });
    };
})();
