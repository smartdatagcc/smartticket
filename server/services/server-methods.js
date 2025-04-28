//(function(){
//    "use strict";
//
//    let lookupData = require('./lookup-data');
//    let extend = require('util')._extend;
//
//
////todo: make this variable to options
//    let SECOND = 1000;
//    let MINUTE = 60 * SECOND;
//
//    let registerServerMethod = function (server, name, func, options) {
//        let opts = extend({
//            expiresIn: 60 * MINUTE,
//            staleIn: 30 * SECOND,
//            staleTimeout: 100
//        }, options);
//        server.method(name, func, {
//            cache: opts,
//            bind: server
//        });
//    };
//
//    module.exports = {
//        registerServerMethods: function(server){
//            registerServerMethod(server, "getCachedLookupData", lookupData.getCachedLookupData);
//            registerServerMethod(server, "getLookupData", lookupData.getLookupDataCallback);
//        }
//    };
//
//})();
//
