const path = require('path');
const EventEmitter = require('events');
const { IPCChannel } = require('./global.js');

class Host extends EventEmitter {
    constructor(mod, file, options, createWindow = true, rootFolder = null) {
        super();
        this.setMaxListeners(0);

        this.mod = mod;
        this.file = file;
        this.options = options;
        this.rootFolder = rootFolder;

        this.ipc = null;
        this.window = null;

        if (createWindow)
            this.show();
    }

    destructor() {
        this.close();
        this.mod = null;
    }

    show(file = null, options = null) {
        if (this.window !== null) {
            this.window.show();
            return;
        }

        const { BrowserWindow } = require('electron');
        this.ipc = require('electron').ipcMain;

        //hotfix for electron deprecation message
        let opt = options || this.options;
        if(!opt.webPreferences || !opt.webPreferences.contextIsolation) {
            if(!opt.webPreferences) opt.webPreferences = {};
            opt.webPreferences.contextIsolation = false;
        }

        this.window = new BrowserWindow(opt);
        this.window.loadFile(path.join(this.rootFolder || this.mod.info.path, file || this.file));
        this.window.on('closed', () => { this._onClosed(); this.window = null; });

        this._handleEvent = this._handleEvent.bind(this);
        this.ipc.on(IPCChannel, this._handleEvent);
    }

    hide() {
        if (this.window !== null)
            this.window.hide();
    }

    _onClosed() {
        if (this.ipc !== null) {
            this.ipc.removeListener(IPCChannel, this._handleEvent);
            this.ipc = null;
        }
    }

    close() {
        if (this.window !== null) {
            this._onClosed();
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

module.exports = Host;
