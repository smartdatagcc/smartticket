(function () {
    "use strict";
    let Promise = require("bluebird"),
        Sanitize = require('../utils/sanitize.js'),
        _ = require('lodash');

    module.exports = function (baseModel, bookshelf) {
        let proto = bookshelf.Model.prototype;

        return baseModel.extend({
            tableName: 'pendingAddUsers',
            hasTimestamps: true,
            tenant: function () {
                return this.belongsTo('Tenant');
            },
            save: function (attrs, options) {
                if (this.__newMetadata){
                    attrs = attrs || {};
                    attrs.user_metadata = this.__newMetadata;
                }
                return proto.save.call(this, attrs, options);
            },
            setMetadata: function (newMetadata, isAdmin){
                let self = this;
                return Promise.resolve(this.relations.tenant ? this.related('tenant') : this.related('tenant').fetch())
                    .then(tenant => {
                        let user_template = tenant.get('userTemplate') || {controls: []};
                        let metadata = self.get('user_metadata') || {controls: {}};


                        if (isAdmin){
                            // admins are not required to fill in user fields when inviting a new user to a tenant.
                            _.each(user_template.controls, item => {
                                item.required = item.adminOnly && item.required;
                            });
                        }

                        self.__newMetadata = Sanitize.metadataFromClient(newMetadata, metadata, user_template, isAdmin);

                        return self;
                    });
            },
            sanitizeMetadata: function (viewAdmin){
                let self = this;
                return Promise.resolve(this.relations.tenant ? this.related('tenant') : this.related('tenant').fetch())
                    .then(tenant => {
                        let user_template = tenant.get('userTemplate') || {controls: []};
                        let metadata = self.get('user_metadata') || {controls: {}};

                        self.set('user_metadata', Sanitize.metadataFromTemplate(metadata, user_template, viewAdmin));

                        return self;
                    });
            }
        });
    };
})();
