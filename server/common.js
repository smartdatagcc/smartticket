/* global process */
"use strict";

let env = require('./env.json');

exports.config = function(node_env) {
    node_env = node_env || process.env.NODE_ENV || 'local';
    return env[node_env];
};

exports.plugins = function(node_env) {
    node_env = node_env || process.env.NODE_ENV || 'local';
    return require('./plugins/plugins.' + node_env);
};
