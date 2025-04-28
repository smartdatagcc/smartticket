"use strict";
let path = require('path');
module.exports = [
    {   register: require('inert') },
    {   register: require('vision') },
    {   register: require('hapi-auth-jwt2') }, //  Enable Authentication
    {
        register: require('hapi-io')
    },
    {
        register: require('hapi-bookshelf-models'),
        options: {
            knex: require('../knexfile.js').test,
            plugins: ['registry', 'visibility', 'virtuals'], // Required
            models: path.join(__dirname, '../models')
        }
    }
];
