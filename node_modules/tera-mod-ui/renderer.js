const EventEmitter = require('events');
const { IPCChannel } = require('./global.js');

class Renderer extends EventEmitter {
    constructor() {
        super();

        this.ipc = require('electron').ipcRenderer;
        this.remote = require('electron').remote;

        this._handleEvent = this._handleEvent.bind(this);
        this.ipc.on(IPCChannel, this._handleEvent);
    }

    destructor() {
        this.ipc.removeListener(IPCChannel, this._handleEvent);
        this.ipc = null;
        this.remote = null;
    }

    _handleEvent(event, name, ...args) {
        this.emit(name, ...args);
    }

    send(name, ...args) {
        this.ipc.send(IPCChannel, name, ...args);
    }

    minimize() {
        return this.remote.getCurrentWindow().minimize();
    }

    maximize() {
        return this.remote.getCurrentWindow().maximize();
    }

    unmaximize() {
        return this.remote.getCurrentWindow().unmaximize();
    }

    isMaximized() {
        return this.remote.getCurrentWindow().isMaximized();
    }

    toggleMaximized() {
        if (this.isMaximized())
            return this.unmaximize();
        else
            return this.maximize();
    }

    close() {
        return this.remote.getCurrentWindow().close();
    }
}

module.exports = Renderer;
