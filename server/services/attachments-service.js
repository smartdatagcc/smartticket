
    "use strict";
    let Promise = require('bluebird'),
        AWS = require('aws-sdk'),
        common =  require('../common'),
        SupportTicketService = require('./support-ticket-service'),
        config = common.config(),
        _ = require('lodash'),
        uuid = require('node-uuid'),
        Base = require('./base'),
        Boom = require('boom');

    module.exports = class AttachmentsService extends Base {
        constructor(request, tenantId){
            super(request);
            this.tenantId = tenantId || request.params.tenantId;
            this.Attachment = this.getModel('Attachment');

            this.supportTicketService = new SupportTicketService(request, tenantId);

            this.executables = ['.EXE', '.PIF','.APPLICATION', '.GADGET', '.MSI', '.MSP', '.COM', '.SCR', '.HTA', '.CPL', '.MSC', '.JAR', '.BAT', '.CMD', '.VB', '.VBE', '.JS', '.JSE', '.WS', '.WSF', '.WSC', '.WSH', '.PS1', '.PS1XML', '.PS2', '.PS2XML', '.PSC1', '.PSC2', '.MSH', '.MSH1', '.MSH2','.MSHXML', '.MSH1XML', '.MSH2XML', '.SCF', '.LNK', '.INF', '.REG', '.DOCM', '.DOTM', '.XLSM', '.XLTM', '.XLAM', '.PPTM', '.POTM', '.PPAM', '.PPSM', '.SLDM','.ACTION', '.APK', '.APP', '.COMMAND', '.CSH', '.IPA', '.PKG', '.KSH', '.OSX', '.OUT', '.PRG', '.RUN', '.WORKFLOW'];
        }

        getAttachment(attachmentId){
            return new this.Attachment().where({id: attachmentId}).fetch()
                .then(this.checkExists("The attachment was not found"));
        }
        deleteAttachment(attachmentId) {
            return new this.Attachment().where({id: attachmentId}).fetch().then(attachment => {
                //I don't think we should actually hard delete it ?  check HIPPA compliance
                return this.Bookshelf.transaction(t => {
                    return attachment.save({deleted: true}, {patch: true, transaction: t})
                        .tap((deletedAttachment) => {
                            let reason = "Remove Attachment",
                                difference = [
                                    {"lhs": null, "rhs": attachment.get('filename'), "kind": "D", "path": ["file"]}
                                ];
                            return this.supportTicketService.addAdditionalHistory(deletedAttachment.get('supportTicketId'), t, reason, difference);
                        });

                });
            });
        }
        saveAttachment(file, ticketId){
            let name = uuid.v1() + '/' +  file.hapi.filename,
                ext = file.hapi.filename.substr(file.hapi.filename.lastIndexOf('.')).toUpperCase();

            if (_.indexOf(this.executables, ext) > -1){
                return Promise.reject(Boom.unsupportedMediaType('Executable files are not allowed.'));
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
                    "Body": file
                }, (err, details) => {
                    if (err){
                        reject(new Error(err));
                    }else{

                        return this.Bookshelf.transaction((t) =>
                                new this.Attachment({
                                    filename: name,
                                    bucket: "supportticket",
                                    eTag: details.ETag,
                                    createdBy: this.credentials.id,
                                    supportTicketId: ticketId
                                }).save(null, {transaction: t}).tap(() => {
                                        let reason = "New Attachment",
                                            difference = [
                                                {"lhs": null, "rhs": file.hapi.filename, "kind": "N", "path": ["file"]}
                                            ];
                                        return this.supportTicketService.addAdditionalHistory(ticketId, t, reason, difference);
                                    })
                        ).then((result) => resolve(result.load('user')));

                    } // end else
                });
            });
        }
    };
