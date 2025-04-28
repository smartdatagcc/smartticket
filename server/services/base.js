"use strict";
let Boom = require('boom');

class BaseService {
    constructor(request){
        if (request.server){
            this.server = request.server;
        }else{
            this.server = request;
        }
        this.Bookshelf = this.server.plugins.bookshelf;
        this.knex = this.Bookshelf.knex;
        this.$$ = this.knex.raw;
        this.credentials = request.auth && request.auth.credentials;

        //this.getModel = this.Bookshelf.model;

        this.payload = request.payload;
        this.params = request.params;
    }

    getModel(name) {
        return this.Bookshelf.model(name);
    }

    checkUserExists(){
        return obj => obj || Promise.reject(Boom.create(400, "User does not exist"));
    }

    checkExists(message){
         return obj => obj ||  Promise.reject(Boom.notFound(message));
    }
}
module.exports = BaseService;