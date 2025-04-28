(function() {
    "use strict";

    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'settings',
            idAttribute: 'key',
            hasTimestamps: false
        });
    };
})();
