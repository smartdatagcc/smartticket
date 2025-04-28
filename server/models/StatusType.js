(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
                tableName: 'statusTypes',
                hasTimestamps: true,
                tenant: function () {
                    return this.belongsTo('Tenant');
                }
            },
            {
                getStatusTypes: function (tenantId) {
                    return bookshelf.knex('statusTypes').where({tenantId: tenantId});
                }
            }
        );
    };
})();
