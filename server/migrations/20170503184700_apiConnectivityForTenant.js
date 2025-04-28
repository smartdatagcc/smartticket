"use strict";
exports.up = function(knex, Promise) {
  return knex.schema
        .table('tenants', function (t) {
            t.bool("apiConnectivity").defaultTo(false);
        });
};

exports.down = function(knex, Promise) {
  return knex.schema
        .table('tenants', function (t) {
            t.dropColumn("apiConnectivity");
        });
};