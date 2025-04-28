//eventually can move this into particular service - ie. tenant socket service, ticket socket service...
(function(){
    "use strict";
    let eventService = require('./event-service'),
        _ = require('lodash'),
        JWT  = require('jsonwebtoken');

    module.exports = {
        connect: function(io) {
            io.sockets.on('connection', (socket) => {

                socket.connectedRooms = [];

                socket.emit('connected');
                socket.on('user-connected', (userToken) => {
                    let token = JWT.decode(userToken);
                    socket.token = token;
                    //console.log(token.name + ' user-connected');
                });

                socket.on('subscribe', (data) => {
                    //you need a token to subscribe...
                    if(socket.token) {
                        //we don't want to keep joining a room they are already joined too
                        let room = _.find(socket.connectedRooms, (r) => r === data.room);
                        if (room) {
                            console.log('already subscribed to ' + data.room);
                        } else {

                            if (data.room.startsWith('user_') && data.room.substr(5) !== socket.token.id.toString()){
                                return; // Blocked
                            }
                            if (data.room.startsWith('tenant_') && !_.some(socket.token.tenants,  {id: parseInt(data.room.substr(7))})){
                                return; // Blocked
                            }
                            //before we allow the user to subscribe, check if they are allowed to get messages....
                            socket.join(data.room);
                            socket.connectedRooms.push(data.room);
                        }
                    }
                });

                socket.on('disconnect', () => {
                    //console.log('socket disconnected');
                });

                eventService.init();

                eventService.subscribe('add-note', (note) => {
                    //get role for this tenant
                    if (socket.token) {
                        let role = _.find(socket.token.roles, (role) => role.tenant_id === note.get('tenantId'));
                        if (role && role.permissions.access['canViewNotes']) {
                            //io.sockets.in('/note_' + request.params.id).emit('note-added', result);
                            //console.log("note-added" + result.note.get('supportTicketId'));
                            socket.in('/note_' + note.get('supportTicketId')).emit('note-added', note);
                        }
                    }
                });

            });
        }
    };
})();
