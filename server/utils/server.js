"use strict";
const common =  require('../common'),
    _ = require('lodash'),
    auth = require("../services/auth"),
    Hapi = require('hapi');

module.exports = function Server(env){
    const config = common.config(env),
        plugins = common.plugins(env);
    let server = new Hapi.Server({
        connections:{
            routes: { cors: true },
            router: {
                isCaseSensitive: false,
                stripTrailingSlash: true
            }
        }
    });

    server.connection({ port: process.env.PORT || config.port, host: config.host });

    server.register(plugins, (err) => {
        if (err) {throw err;}

        // Enable Authentication
        server.auth.strategy('token', 'jwt', {
            key: config.privateKey,
            validateFunc: auth.validate
        });

        // Register Routes
        server.register({
            register: require('hapi-router'),
            options: {
                cwd: __dirname,
                routes: '../routes/**/*-route.js' // uses glob to include files
            }
        }, (err) => {
            if (err) {throw err;}
        });
    });
    
    return server;
};
