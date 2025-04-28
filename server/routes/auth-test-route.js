(function() {
    "use strict";

    module.exports = [{
        method: "GET",
        path: "/api/auth/test",
        config: {
            auth: 'token',
            tags: ['api']
        },
        handler: (request, reply) => {
            reply(request.auth.credentials);
        }
    }];
})();
