(function() {
    "use strict";

    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'notifications',
            hasTimestamps: true,

            user: function(){
                return this.belongsTo('User', 'user_id');
            },
            tenant: function(){
                return this.belongsTo('Tenant', 'tenant_id');
            }
        });
    };

})();
