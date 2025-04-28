(function() {
    "use strict";
    
    let Promise = require("bluebird"),
        _ = require('lodash');

    module.exports = function (baseModel, bookshelf) {
        let proto = bookshelf.Model.prototype;


        return baseModel.extend({
            tableName: 'supportTicketHistory',
            hasTimestamps: true,
            //cannot do this because it causes issues when deleting a status - we'd have to handle this here
            statusType: function () {
                return this.belongsTo('StatusType', 'statusType');
            },
            //created by user
            user: function(){
                return this.belongsTo('User', 'createdBy');
            },
            assignedUser: function(){
                return this.belongsTo('User', 'assignedTo');
            },
            updatedByUser: function(){
                return this.belongsTo('User', 'updatedBy');
            }
        });
    };
})();
