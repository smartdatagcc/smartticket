"use strict";

let Promise = require("bluebird"),
    moment = require('moment'),
    _ = require('lodash');

module.exports = class Sanitize{
    constructor (){

    }
    

    static metadataFromClient(newMetadata, existingMetadata, template, isAdmin){
        // check for empty and set default values
        existingMetadata = existingMetadata || {};
        if (!existingMetadata.controls || _.isArray(existingMetadata.controls)){
            existingMetadata.controls = {};
        }

        newMetadata = newMetadata || {};
        newMetadata.controls = newMetadata.controls || {};
        template = template || {};
        template.controls = template.controls || {};

        // handle both object-based controls {name: 'key', value: 'value'} and dictionary-based controls {key: value}
        if (_.isArray(newMetadata.controls)){
            newMetadata.controls = _.reduce(newMetadata.controls, (r, v) =>{
                r[v.name] = v['value'];
                return r;
            }, {});
        }

        // pass through all non-control metadata
        _.each(newMetadata, function (m, k){
            if (k !== "controls"){
                existingMetadata[k] = m;
            }
        });

        // loop through controls an validate
        _.each(template.controls, ct => {
            if (!ct.adminOnly || isAdmin) {
                existingMetadata.controls[ct.name] = this.field(newMetadata.controls[ct.name], ct, existingMetadata);
            }
        });
        return existingMetadata;
    }

    // sanitize metadata coning in from server
    static metadataFromTemplate(existingMetadata, template, viewAdmin){
        // check for empty and set default values
        existingMetadata = existingMetadata || {};
        if (!existingMetadata.controls || _.isArray(existingMetadata.controls)){
            existingMetadata.controls = {};
        }

        template = template || {};
        template.controls = template.controls || {};

        let fullMetadata = {
            controls: _.reduce(template.controls, (r, ct) => {
                ct.value = existingMetadata.controls[ct.name];

                //if not an admin field
                if(!ct.adminOnly){
                    ct.required = ct.required && (ct.value !== undefined && ct.value !== null && ct.value !== '' && ct.value.length !== 0);
                }

                if(viewAdmin || !ct.adminOnly){
                    r.push(ct);
                }

                return r;
            }, [])
        };

        _.each(existingMetadata, function (m, k){
            if (k !== "controls"){
                fullMetadata[k] = m;
            }
        });
        return fullMetadata;
    }

    static field(newValue, template, existingMetadata){

        var hasExistingValue = (
            existingMetadata.controls[template.name] !== undefined &&
            existingMetadata.controls[template.name] !== null &&
            existingMetadata.controls[template.name] !== '' &&
            existingMetadata.controls[template.name].length !== 0
        );

        var hasNewValue = (
            newValue !== undefined &&
            newValue !== null &&
            newValue !== '' &&
            newValue.length !== 0
        );

        var isNewRecord = !_.some(existingMetadata.controls);

        //only required if it has a value and it's not an adminOnly control
        if ((hasExistingValue || isNewRecord ) && template.required && !hasNewValue) {
            throw new Error(template.name + ' is required.');
        }

        //it's an adminOnly control and you are an admin - you are required
        if (template.adminOnly && template.required && !hasNewValue) {
            throw new Error(template.name + ' is required.');
        }

        moment.suppressDeprecationWarnings = true;

        try {
            switch(template.type) {
                case "checkboxlist":
                    if (typeof newValue === 'string'){
                        newValue = newValue.split(',');
                    }

                    // remove invalid values
                    return _.filter(newValue, (v) => _.indexOf(template.options, v) > -1);
                case "radiobuttonlist":
                case "select":
                    if (newValue && _.indexOf(template.options, newValue) === -1){
                        throw new Error('Invalid value for ' + template.name);
                    }
                    return newValue;
                case "timepicker":
                {
                    let time = /^\d+:\d+(\s+[APap][Mm])?$/;
                    if (time.test(newValue)) {
                        newValue = moment(new Date()).utc().format('YYYY-MM-DD ' + newValue);
                    }

                    let date = moment.utc(newValue).year(2000).month(1).day(1);
                    if (newValue && !date.isValid()) {
                        throw new Error('Invalid value for ' + template.name);
                    }

                    return date.format();
                }
                case "datepicker":
                {
                    let date = moment(newValue);

                    if (newValue && !date.isValid()) {
                        throw new Error('Invalid value for ' + template.name);
                    }
                    return newValue;
                }
                case "phone number":
                    let phone = /^\(?[0-9]{3}(\-|\))? ?[0-9]{3}-?[0-9]{4}$/;
                    if (newValue && !phone.test(newValue)){
                        throw new Error('Invalid value for ' + template.name);
                    }
                    return newValue;
                case "email":
                    let email = /.+@.+/i;
                    if (newValue && !email.test(newValue)){
                        throw new Error('Invalid value for ' + template.name);
                    }
                    return newValue;
                case "toggle":
                    return !!newValue;
                default:
                    return newValue;
            }
        } catch(err) {
            console.log('Sanitize error, ', err);
            return newValue;
        }


    }
};
