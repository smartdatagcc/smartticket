'use strict';
let Code = require('code');
let Lab = require('lab');
let Hapi = require('hapi');
let setup = require('./server');



let lab = exports.lab = Lab.script();
/* jshint ignore:start */
let beforeEach = lab.beforeEach;
let describe = lab.describe;
let expect = Code.expect;
let it = lab.it;
/* jshint ignore:end */
let before = lab.before;
let after = lab.after;
let experiment = lab.experiment;
let test = lab.test;


experiment('Auth Route', function (){
    let server;
    before(function (done){
        setup.getServer(function(err, s){
            server = s;
            done();
        });
    });

    after(function(done) {
        return setup.rollback(server, done);
    });

    test('can login', function (done) {

        server.inject({
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            url: '/api/auth',
            payload: {
                email: "supportticket@smartdatasystems.net",
                password: "!QAZ2wsx"
            }
        }, function(res) {

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.object();
            expect(res.result.token).to.exist();

            done();
        });
    });

    test('can authenticate with a token', function (done) {

        server.inject({
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            url: '/api/auth',
            payload: {
                email: "supportticket@smartdatasystems.net",
                password: "!QAZ2wsx"
            }
        }, function(res) {

            server.inject({
                method: 'GET',
                headers: {
                    "authorization": "Bearer " + res.result.token
                },
                url: '/api/auth/test'
            }, function(res) {

                expect(res.statusCode).to.equal(200);
                //todo verify this expect
                //expect(res.result.email).to.equal("supportticket@smartdatasystems.net");

                done();
            });
        });
    });
});
