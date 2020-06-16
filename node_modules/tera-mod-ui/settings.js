const Host = require('./host');
const EventEmitter = require('events');
const path = require('path');

class Settings extends EventEmitter {
    constructor(mod, structure, settings, options = {}) {
        super();

        this.structure = structure;
        this.settings = settings;

        this.ui = new Host(mod, 'index.html', Object.assign({
            title: `${mod.info.options.guiName || mod.info.name} - Settings`,
            icon: path.join(__dirname, 'settings_ui', './icon.ico'),
            width: 480,
            height: 520,
            frame: false,
            resizable: true,
            webPreferences: {
                nodeIntegration: true,
                devTools: false
            }
        }, options), false, path.join(__dirname, 'settings_ui'));

        this.ui.on('init', () => {
            this.ui.send('init', mod.info.options.guiName || mod.info.name, global.TeraProxy.GUITheme, this.structure, this.settings);
        });

        this.ui.on('update', (key, value) => {
            this.settings[key] = value;
            this.emit('update', this.settings);
        });
    }

    destructor() {
        this.ui.destructor();
        this.ui = null;

        this.removeAllListeners();
    }

    show() {
        if (this.ui)
            this.ui.show();
    }

    hide() {
        if (this.ui)
            this.ui.hide();
    }

    close() {
        if (this.ui)
            this.ui.close();
    }

    update(settings) {
        this.settings = settings;
        this.ui.send('update', settings);
    }
}

module.exports = Settings;
