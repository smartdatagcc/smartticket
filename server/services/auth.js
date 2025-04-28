"use strict";

class Auth {
    validate (decodedToken, request, callback) {
        return callback(null, !!decodedToken.id, decodedToken.id ? decodedToken : false);
    }

    isInRole (credentials, role) {
        return credentials.role === role;
    }
}

module.exports = new Auth();

