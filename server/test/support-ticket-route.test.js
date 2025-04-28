(function(){
    "use strict";

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

    experiment('support tickets', function(){
        let server, auth, user;
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

        after(function(done) {
            return setup.rollback(server, done);
        });

        test('can hit get all support tickets api', function (done) {
            server.inject({
                method: 'GET',
                headers: {
                    "authorization": auth
                },
                url: '/api/' + user.tenants[0].id + '/supporttickets'
            }, function(res) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
    });
})();
