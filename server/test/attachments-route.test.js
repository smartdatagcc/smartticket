'use strict';
let Code = require('code');
let Lab = require('lab');
let Hapi = require('hapi');
let setup = require('./server');
let mockKnex = require('mock-knex');
let attachmentsService = require("../services/attachments-service");

let lab = exports.lab = Lab.script();
/* jshint ignore:start */
let beforeEach = lab.beforeEach;
let afterEach = lab.afterEach;
let describe = lab.describe;
let expect = Code.expect;
let it = lab.it;
/* jshint ignore:end */
let before = lab.before;
let after = lab.after;
let experiment = lab.experiment;
let test = lab.test;


experiment('Attachments Route', function (){
    let server, auth, user, tracker = mockKnex.getTracker();
    before(function (done){
        setup.getServer(function(err, s){
            server = s;

            setup.getToken(server, "supportticket@smartdatasystems.net", "!QAZ2wsx", function (t, u){

                auth = t;
                user = u;
                done();
            });
        });
    });
    after(function (done){

        return setup.rollback(server, done);
    });


    //test('can get attachment', function (done) {
    //    tracker.install();
    //    tracker.on('query', function sendResult(query) {
    //        query.response([{
    //            id:500,
    //            bucket: 'abc',
    //            filename: 'yyy.png'
    //        }]);
    //    });
    //
    //    server.inject({
    //        method: 'GET',
    //        headers: {
    //            "authorization": auth
    //        },
    //        url: '/api/1/attachments/500'
    //    }, function(res) {
    //        expect(res.statusCode).to.equal(200);
    //        tracker.uninstall();
    //        done();
    //    });
    //});

});
