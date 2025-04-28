(function(){
    "use strict";

    let EventEmitter = require('events').EventEmitter,
        instance;

    module.exports = {
        init : function() {
            if(instance === undefined){
                //console.log('init new event emitter');
                instance = new EventEmitter();
                instance.setMaxListeners(0);
                return this;
            }else{
                //console.log('event emitter exists');
                return this;
            }
        },
        subscribe: function(eventKey, fn) {
            if(!instance){
                this.init();
            }
            //console.log('subscribe to ' + eventKey);
            instance.on(eventKey, fn);
        },
        publish: function(eventKey, data){
            if(!instance){
                this.init();
            }
            //console.log('publish to ' + eventKey);
            instance.emit(eventKey, data);
        },
        removeListener: function(eventKey, listener) {
            if(!instance){
                this.init();
            }
            //console.log('removing listener to ' + eventKey);
            instance.removeListener(eventKey, listener);
        }
    };

})();

