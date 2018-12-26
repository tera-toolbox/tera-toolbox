const EventEmitter = require('events');
const { IPCChannel } = require('./global.js');
const { remote, ipcRenderer } = require('electron');

class Renderer extends EventEmitter {
    constructor() {
        super();

        this._handleEvent = this._handleEvent.bind(this);
        ipcRenderer.on(IPCChannel, this._handleEvent);
    }

    destructor() {
        ipcRenderer.removeListener(IPCChannel, this._handleEvent);
    }

    _handleEvent(event, name, ...args) {
        this.emit(name, ...args);
    }

    send(name, ...args) {
        ipcRenderer.send(IPCChannel, name, ...args);
    }

    minimize() {
        return remote.getCurrentWindow().minimize();
    }

    maximize() {
        return remote.getCurrentWindow().maximize();
    }

    unmaximize() {
        return remote.getCurrentWindow().unmaximize();
    }

    isMaximized() {
        return remote.getCurrentWindow().isMaximized();
    }

    toggleMaximized() {
        if (this.isMaximized())
            this.unmaximize();
        else
            this.maximize();
    }

    close() {
        remote.getCurrentWindow().close();
    }
}

module.exports = Renderer;
