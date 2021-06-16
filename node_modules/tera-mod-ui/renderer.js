const EventEmitter = require('events');
const { IPCChannel } = require('./global.js');
const events = require("./enums.js");

class Renderer extends EventEmitter {
    constructor() {
        super();

        this.ipc = require('electron').ipcRenderer;

        this._handleEvent = this._handleEvent.bind(this);
        this.ipc.on(IPCChannel, this._handleEvent);
    }

    destructor() {
        this.ipc.removeListener(IPCChannel, this._handleEvent);
        this.ipc = null;
    }

    _handleEvent(event, name, ...args) {
        this.emit(name, ...args);
    }

    send(name, ...args) {
        this.ipc.send(IPCChannel, name, ...args);
    }

    minimize() {
        return this.send(events.MINIMIZE_EVENT);
    }

    maximize() {
        return this.send(events.MAXIMIZE_EVENT);
    }

    close() {
        return this.send(events.CLOSE_EVENT);
    }
}

module.exports = Renderer;
