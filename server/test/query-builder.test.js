'use strict';
let Code = require('code');
let Lab = require('lab');
let Hapi = require('hapi');
let Builder = require('../utils/query-builder');
let mockKnex = require('mock-knex');
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

experiment('Query Builder', function (){
    let server, builder, tracker = mockKnex.getTracker();
    before(function (done){
        builder = new Builder();
        setup.getServer(function(err, s){
            server = s;
            done();
        });
    });

    after(function (done){
        return setup.rollback(server, done);
    });

    test('parse empty filter', function (done) {
        tracker.install();
        tracker.on('query', function sendResult(query) {
            expect(query.sql).to.equal('select "id" from "supportTickets"');
            query.response([{id : 1}]);
        });

        let query = server.plugins.bookshelf.knex('supportTickets').select('id');
        let params = {

        };

        builder.createQuery(query, params).then(function (model){
            tracker.uninstall();
            done();
        });
    });

    test('parse order by filter', function (done) {
        tracker.install();
        tracker.on('query', function sendResult(query) {
            expect(query.sql).to.equal('select "id" from "supportTickets" order by "id" asc');
            query.response([{id : 1}]);
        });

        let query = server.plugins.bookshelf.knex('supportTickets').select('id');
        let params = {
            $orderby: 'id'
        };

        builder.orderBy(query, params).then(function (model){
            tracker.uninstall();
            done();
        });
    });

    test('parse top filter', function (done) {
        tracker.install();
        tracker.on('query', function sendResult(query) {
            expect(query.sql).to.equal('select "id" from "supportTickets" limit ?');
            expect(query.bindings).to.include(20);
            query.response([{id : 1}]);
        });

        let query = server.plugins.bookshelf.knex('supportTickets').select('id');
        let params = {
            $top: 20
        };

        builder.createQuery(query, params).then(function (model){
            tracker.uninstall();
            done();
        });
    });

    test('parse skip filter', function (done) {
        tracker.install();
        tracker.on('query', function sendResult(query) {
            expect(query.sql).to.equal('select "id" from "supportTickets" offset ?');
            expect(query.bindings).to.include(20);
            query.response([{id : 1}]);
        });

        let query = server.plugins.bookshelf.knex('supportTickets').select('id');
        let params = {
            $skip: 20
        };

        builder.createQuery(query, params).then(function (model){
            tracker.uninstall();
            done();
        });
    });

    test('parse datetime filter', function (done) {
        tracker.install();
        tracker.on('query', function sendResult(query) {
            expect(query.sql).to.equal('select "id" from "supportTickets" where ("created_at" >= ?)');
            expect(query.bindings[0]).to.be.a.date();
            query.response([{id : 1}]);
        });

        let query = server.plugins.bookshelf.knex('supportTickets').select('id');
        let params = {
            $filter: "created_at ge datetime'2015-01-20T01:00:00.000-04:00'"
        };

        builder.createQuery(query, params).then(function (model){
            tracker.uninstall();
            done();
        });
    });

    test('parse or filter', function (done) {
        tracker.install();
        tracker.on('query', function sendResult(query) {
            let correctQuery = 'select "id" from "supportTickets" where ("created_at" >= ?)';
            expect(query.sql).to.equal(correctQuery);
            expect(query.bindings[0]).to.be.a.date();
            expect(query.bindings[1]).to.be.a.string();
            query.response([{id : 1}]);
        });

        let query = server.plugins.bookshelf.knex('supportTickets').select('id');
        let params = {
            $filter: "created_at ge datetime'2015-01-20T01:00:00.000-04:00'"
        };

        builder.createQuery(query, params).then(function (model){
            tracker.uninstall();
            done();
        });
    });

});
