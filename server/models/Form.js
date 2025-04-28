(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'forms',
            hasTimestamps: true,
            hidden: ['deleted'],
            tenant: function () {
                return this.belongsTo('Tenant');
            },
            tickets: function (){
                return this.hasMany('SupportTicket', 'formId');
            },
            responseTemplates: function (){
                return this.hasMany('ResponseTemplate', 'formId');
            }
        });
    };
})();
