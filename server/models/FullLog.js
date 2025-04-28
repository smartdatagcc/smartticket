(function() {
    "use strict";
    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
                tableName: 'full_log',
                hasTimestamps: true
            }
        );
    };
})();
