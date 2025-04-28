(function() {
    "use strict";

    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'notes',
            hasTimestamps: true,
            hidden: ['deleted'],
            supportTicket: function () {
                return this.belongsTo('SupportTicket');
            },
            user: function(){
                return this.belongsTo('User', 'createdBy');
            }
        });
    };

})();
