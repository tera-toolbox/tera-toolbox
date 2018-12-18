const path = require('path');
const EventEmitter = require('events');

const IPCChannel = 'tera-mod-ui-ipc';

class Host extends EventEmitter {
    constructor(mod, file, options) {
        super();
        this.setMaxListeners(0);

        this.mod = mod;

        const { BrowserWindow } = require('electron');
        this.ipc = require('electron').ipcMain;

        this.window = new BrowserWindow(options);
        this.window.loadFile(path.join(this.mod.rootFolder, file));
        this.window.on('closed', () => { this.window = null; });

        this._handleEvent = this._handleEvent.bind(this);
        this.ipc.on(IPCChannel, this._handleEvent);
    }

    destructor() {
        this.close();
    }

    show() {
        if (this.window !== null)
            this.window.show();
    }

    hide() {
        if (this.window !== null)
            this.window.hide();
    }

    close() {
        if (this.window !== null) {
            this.ipc.removeListener(IPCChannel, this._handleEvent);
            this.ipc = null;

            this.window.close();
            this.window = null;
        }
    }

    _handleEvent(event, name, ...args) {
        if (this.window && event.sender.id === this.window.id)
            this.emit(name, ...args);
    }

    send(name, ...args) {
        if (this.window !== null)
            return this.window.webContents.send(IPCChannel, name, ...args);
        return false;
    }
}

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
}

module.exports = { Host, Renderer };
