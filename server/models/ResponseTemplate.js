(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'responseTemplates',
            form: function () {
                return this.belongsTo('Form');
            },
            user: function(){
                return this.belongsTo('User', 'createdBy');
            },
            updatedByUser: function(){
                return this.belongsTo('User', 'updatedBy');
            }
        });
    };
})();
