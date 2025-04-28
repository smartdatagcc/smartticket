(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'newsletters',
            idAttribute: 'email',
            hasTimestamps: true
        });
    };
})();
