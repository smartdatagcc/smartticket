"use strict";

let Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    common =  require('../common'),
    config = common.config(),
    _ = require('lodash'),
    uuid = require('node-uuid'),
    Base = require('./base.js'),
    Boom = require('boom');

module.exports = class TenantService extends Base{
    constructor(request){
        super(request);
        this.Tenant = this.getModel('Tenant');
    }

    getTenant (tenantId) {
        return new this.Tenant({id: tenantId, deleted:false}).fetch({withRelated: ['roles']});
    }

    updateTenant (tenantId, payload) {
        return this.Bookshelf.transaction(t =>
                new this.Tenant({id: tenantId}).fetch()
                    .then(this.checkExists("Tenant does not exist"))
                    .then(existingTenant => {
                        let tenantSettings = existingTenant.get('tenantSettings');
                        tenantSettings.settings = payload.tenantSettings.settings;
                        payload.tenantSettings = tenantSettings;

                        if (payload.userTemplate && payload.userTemplate.settings &&_.some(payload.userTemplate.settings, v => _.some(['email', 'deleted', 'name','password', 'su', 'id'], v.name))){
                            return Promise.reject(new Boom.badRequest('Cannot create a metadata field with a reserved name.'));
                        }

                        return existingTenant.save(_.pick(payload, ['name', 'userTemplate', 'tenantSettings']), {patch: true, transacting: t});
                    })
        );
    }

    saveLogo (tenantId, payload){
        let name = uuid.v1() + '/' +  payload.file.hapi.filename,
            ext = payload.file.hapi.filename.substr(payload.file.hapi.filename.lastIndexOf('.')).toUpperCase();

        if (_.indexOf(['.PNG', '.JPG', '.JPEG', '.GIF', '.SVG', '.BMP'], ext) === -1){
            return Promise.reject(Boom.unsupportedMediaType('Must be an image.'));
        }

        let s3 = new AWS.S3({
            accessKeyId: config.aws_accessKeyId,
            secretAccessKey: config.aws_secretAccessKey,
            signatureVersion: 'v4'
        });
        return new Promise((resolve, reject) => {
            s3.upload({
                "Bucket": "supportticket",
                "Key": name,
                "Body": payload.file,
                "ACL": "public-read"
            }, (err, details) => {
                if (err){
                    reject(new Error(err));
                }else{
                    return new this.Tenant({id: tenantId}).fetch()
                        .tap(existingTenant => {
                            let tenantSettings = existingTenant.get('tenantSettings');
                            if (tenantSettings.settings.logoUrl){
                                return module.exports.awsDeleteLogo(tenantSettings.settings.logoBucket, tenantSettings.settings.logoFileName);
                            }

                        })
                        .then(existingTenant => {
                            if(existingTenant) {
                                let tenantSettings = existingTenant.get('tenantSettings');
                                tenantSettings.settings.logoUrl = details.Location;
                                tenantSettings.settings.logoBucket = "supportticket";
                                tenantSettings.settings.logoFileName = name;

                                return existingTenant.save({tenantSettings: tenantSettings}, {patch: true});
                            }
                        })
                        .then(resolve({logoUrl: details.Location, logoBucket: "supportticket", logoFileName: name}), reject);
                }
            });
        });
    }

    removeLogo (tenantId){ 
        return new this.Tenant({id: tenantId}).fetch()
            .tap(existingTenant => {
                let tenantSettings = existingTenant.get('tenantSettings');

                //console.log(tenantSettings.settings);
                if (tenantSettings.settings.logoUrl){
                    return this.awsDeleteLogo(tenantSettings.settings.logoBucket, tenantSettings.settings.logoFileName);
                }
            })
            .then(existingTenant => {
                if(existingTenant) {
                    let tenantSettings = existingTenant.get('tenantSettings');
                    tenantSettings.settings.logoUrl = null;
                    tenantSettings.settings.logoBucket = null;
                    tenantSettings.settings.logoFileName = null;

                    return existingTenant.save({tenantSettings: tenantSettings}, {patch: true});
                }
            })
            .then(() => ({logoUrl: null, logoBucket: null, logoFileName: null}));
    }

    awsDeleteLogo (bucket, key) {
        let s3 = new AWS.S3({
            accessKeyId: config.aws_accessKeyId,
            secretAccessKey: config.aws_secretAccessKey
        });
        return new Promise((resolve, reject) => {
            s3.deleteObject({
                "Bucket": bucket,
                "Key": key
            }, (err, data) => {
                if (err){
                    reject(new Error(err));
                } else {
                    resolve(data);
                }
            });
        });

    }
};

