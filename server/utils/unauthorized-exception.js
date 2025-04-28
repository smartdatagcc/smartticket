(function(){
    "use strict";

    function UnAuthorizedException(){
        this.message = "Access Denied";
        this.name = "UnAuthorizedException";
        Error.captureStackTrace(this, UnAuthorizedException);
    }

    UnAuthorizedException.prototype = Object.create(Error.prototype);
    UnAuthorizedException.prototype.constructor = UnAuthorizedException;

    module.exports =  UnAuthorizedException;
})();
