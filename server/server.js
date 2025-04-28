/* global process */
/* global __dirname */
(function(){
    "use strict";

    const Server = require('./utils/server');
    const config = require('./common').config();
    const socketService = require('./services/socket-service');

    process.chdir(__dirname);

    console.info('Running node ' + process.version, ', Environment:', process.env.NODE_ENV || 'local');
    let server = new Server();

    server.start()
        .then((s) => server.plugins.bookshelf.knex.migrate.latest())
        .then((m) => server.plugins.bookshelf.knex('users').count('id'))
        .then((c) => parseInt(c[0].count,10) ? null : server.plugins.bookshelf.knex.seed.run())
        .then((i) => {
            console.info('Server running at:', server.info.uri, ', Environment:', process.env.NODE_ENV || 'local');
            let io = server.plugins['hapi-io'].io;
            socketService.connect(io);
        },  (err) => {
            console.error("Error:", err);
    });

    if (config.logRequests) {
        server.on('response', (request) => {

            let Log = request.server.plugins.bookshelf.model("FullLog");
            new Log().save({
                verb: request.method.toUpperCase(),
                url:  request.url.path,
                from: request.info.remoteAddress,
                data: JSON.stringify(request.payload),
                user_id: request.auth.credentials ?  request.auth.credentials.id : null
            }).error((err) => {
                console.log('logging', err.stack);
            });
        });
    }
})();
