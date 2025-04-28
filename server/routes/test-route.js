(function() {
    "use strict";


    module.exports = [{
        method: "GET",
        path: "/api/test",
        config: {
            tags: ['api']
        },
        handler: (request, reply) => {
            //let Tenant = request.server.plugins.bookshelf.model('T');
            //let Roles = request.server.plugins.bookshelf.model('R');
            //let Users = request.server.plugins.bookshelf.model('U');
            //return new Tenant({id:2}).fetch({withRelated:['roles']}).then(function(tenant){
            //    reply(tenant);
            //});

            //let Users = request.server.plugins.bookshelf.model('U');
            //return new Users().fetch({email:'superuser@smartdatasystems.com', withRelated:['tenants', 'roles']}).then(function(user){
            //    //get user roles for each tenant
            //    reply(user);
            //});
        }
    }];
})();
