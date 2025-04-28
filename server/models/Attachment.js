(function(){
    "use strict";
    let AWS = require('aws-sdk'),
        common =  require('../common'),
        config = common.config();

    module.exports = function (baseModel, bookshelf) {
        return baseModel.extend({
            tableName: 'attachments',
            hasTimestamps: true,
            hidden: ['deleted'],
            virtuals: {
                url: function (){
                    if (!this.get('bucket') && this.get('filename').indexOf('http') === 0){
                        return this.get('filename');
                    }else {
                        let s3 = new AWS.S3({
                            accessKeyId: config.aws_accessKeyId,
                            secretAccessKey: config.aws_secretAccessKey
                        });
                        return s3.getSignedUrl('getObject', {
                            Bucket: this.get('bucket'),
                            Key: this.get('filename'),
                            Expires: 600
                        });
                    }
                }
            },
            supportTicket: function () {
                return this.belongsTo('SupportTicket');
            },
            user: function(){
                return this.belongsTo('User', 'createdBy');
            }
        });
    };
})();

