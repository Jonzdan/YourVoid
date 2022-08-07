const fs = require('fs');
const EventEmitter = require('events');

class AppEvent extends EventEmitter  {
    raiseMessageEvent(message, username, id) { //message that is raised
        
        this.emit('messageEvent', {content: message, name: username, token: id});
    }

}

module.exports = AppEvent;
