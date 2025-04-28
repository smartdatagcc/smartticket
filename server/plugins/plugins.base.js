"use strict";
let path = require('path');
module.exports = [
    {   register: require('inert') },
    {   register: require('vision') }, //
    {   register: require('hapi-auth-jwt2') }, //  Enable Authentication
    {
        register: require('hapi-io'),
        options: {
            socketio: {
                secure:true
            }
        }
    },
    {
        register: require('hapi-swagger'),
        options: {           
            basePath: '/api/',
            pathPrefixSize: 2,
            enableDocumentation:true,
            validatorUrl: null,
            securityDefinitions: {
                "token": {
                    type: "apiKey",
                    in: "header",
                    na: "Authorization"
                }
            }
        }
    },
    {
        register: require('hapi-bookshelf-models'),
        options: {
            knex: require('../knexfile.js')[process.env.NODE_ENV || 'local'],
            plugins: ['registry', 'visibility', 'virtuals'], // Required
            models: path.join(__dirname, '../models')
        }
    }
];
