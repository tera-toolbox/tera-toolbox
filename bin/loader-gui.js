const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');

// Configuration
function SaveConfiguration(newConfig) {
    global.TeraProxy.DevMode = !!newConfig.devmode;
    global.TeraProxy.GUITheme = newConfig.gui.theme;
    require('./config').saveConfig(newConfig);
}

// Region
function LoadRegion(region) {
    try {
        return require('./config').loadRegion(region);
    } catch (e) {
        showError(`ERROR: Unable to load region information: ${e}`);
        showError(`ERROR: Try to fix it yourself or ask here: ${global.TeraProxy.SupportUrl}!`);
        process.exit(1);
    }
}

// Installed mod management
const AvailableModuleListUrl = "https://raw.githubusercontent.com/caali-hackerman/tera-mods/master/modulelist.json";
const { listModuleInfos, installModule, uninstallModule, toggleAutoUpdate } = require('tera-proxy-game').ModuleInstallation;

let CachedAvailableModuleList = null;
async function getInstallableMods(forceRefresh = false) {
    // (Re)download list of all available modules if required
    if (!CachedAvailableModuleList || forceRefresh) {
        const request = require('request-promise-native');
        CachedAvailableModuleList = await request({ url: AvailableModuleListUrl, json: true });
    }

    // Filter out already installed mods
    const installedModInfos = listModuleInfos(ModuleFolder);
    return CachedAvailableModuleList.filter(modInfo => !installedModInfos.some(installedModInfo => installedModInfo.name === modInfo.name.toLowerCase()));
}

// Proxy Main
let proxy = null;
function _StartProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig) {
    if (proxy)
        return false;

    const TeraProxy = require('./proxy');
    proxy = new TeraProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
    try {
        proxy.run();
        return true;
    } catch (_) {
        console.error('[proxy] Unable to start proxy!');
        proxy = null;
        return false;
    }
}

async function StartProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig) {
    if (proxy)
        return false;

    if (ProxyConfig.noupdate) {
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        log("!!!!!      YOU HAVE GLOBALLY DISABLED AUTOMATIC UPDATES     !!!!!");
        log("!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
        log("!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return _StartProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
    } else {
        const autoUpdate = require("./update");

        try {
            const updateResult = await autoUpdate(ModuleFolder, ProxyConfig.updatelog, true, ProxyRegionConfig.idShort);

            for (let mod of updateResult["legacy"])
                log(`[update] WARNING: Module ${mod.name} does not support auto-updating!`);
            for (let mod of updateResult["failed"])
                log(`[update] ERROR: Module ${mod.name} could not be updated and might be broken!`);
            if (!updateResult["tera-data"])
                log("[update] ERROR: There were errors updating tera-data. This might result in further errors.");

            delete require.cache[require.resolve("tera-data-parser")];
            delete require.cache[require.resolve("tera-proxy-game")];

            return _StartProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
        } catch (e) {
            error(`ERROR: Unable to auto-update: ${e}`);
            return false;
        }
    }
}

async function StopProxy() {
    if (!proxy)
        return false;

    proxy.destructor();
    proxy = null;
    return true;
}

// Clean exit
const isWindows = process.platform === "win32";

function cleanExit() {
    log("terminating...");

    StopProxy().then(() => {
        if (isWindows)
            process.stdin.pause();
    });
}

if (isWindows) {
    require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    }).on("SIGINT", () => process.emit("SIGINT"));
}

process.on("SIGHUP", cleanExit);
process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

// IPC
ipcMain.on('init', (event, _) => {
    event.sender.send('set config', config);

    if (config.noselfupdate) {
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        log("!!!!!    YOU HAVE DISABLED AUTOMATIC PROXY SELF-UPDATING    !!!!!");
        log("!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
        log("!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }

    if (config.gui.autostart) {
        log("Starting proxy...");
        StartProxy(ModuleFolder, config, LoadRegion(config.region)).then((result) => {
            event.sender.send('proxy running', result);
        });
    }
});

ipcMain.on('start proxy', (event, _) => {
    log("Starting proxy...");
    StartProxy(ModuleFolder, config, LoadRegion(config.region)).then((result) => {
        event.sender.send('proxy running', result);
    });
});

ipcMain.on('stop proxy', (event, _) => {
    log("Stopping proxy...");
    StopProxy().then(() => {
        event.sender.send('proxy running', false);
        log("Proxy stopped!");
    });
});

ipcMain.on('get config', (event, _) => {
    event.sender.send('set config', config);
});

ipcMain.on('set config', (_, newConfig) => {
    config = newConfig;
    SaveConfiguration(config);
});

ipcMain.on('get mods', (event, _) => {
    event.sender.send('set mods', listModuleInfos(ModuleFolder));
});

ipcMain.on('get installable mods', (event, _) => {
    getInstallableMods(true).then(mods => event.sender.send('set installable mods', mods));
});

ipcMain.on('install mod', (event, modInfo) => {
    installModule(ModuleFolder, modInfo);
    log(`Installed "${modInfo.name}"`);
    getInstallableMods().then(mods => event.sender.send('set installable mods', mods));
});

ipcMain.on('toggle mod autoupdate', (event, modInfo) => {
    toggleAutoUpdate(modInfo);
    log(`${modInfo.autoUpdateDisabled ? 'Enabled' : 'Disabled'} automatic updates for "${modInfo.rawName}"`);
    event.sender.send('set mods', listModuleInfos(ModuleFolder));
});

ipcMain.on('uninstall mod', (event, modInfo) => {
    uninstallModule(modInfo);
    log(`Uninstalled "${modInfo.rawName}"`);
    event.sender.send('set mods', listModuleInfos(ModuleFolder));
});


// GUI
class TeraProxyGUI {
    constructor() {
        this.window = null;
        this.tray = null;
    }

    show() {
        if (this.window !== null) {
            this.window.show();
            if (this.window.isMinimized())
                this.window.restore();
            this.window.focus();
            return;
        }

        // Initialize main window
        const guiRoot = path.join(__dirname, 'gui');
        const guiIcon = path.join(guiRoot, 'icon.png');

        this.window = new BrowserWindow({
            title: 'Caali\'s Tera Proxy',
            width: 1215,
            height: 675,
            icon: guiIcon,
            frame: false,
            backgroundColor: '#292F33',
            resizable: false,
            webPreferences: {
                devTools: false
            }
        });
        this.window.loadFile(path.join(guiRoot, 'index.html'));
        //this.window.webContents.openDevTools();

        //this.window.on('minimize', () => { this.window.hide(); });
        this.window.on('closed', () => { StopProxy(); this.window = null; });

        // Redirect console to built-in one
        const nodeConsole = require('console');
        console = new nodeConsole.Console(process.stdout, process.stderr);
        ['stdout', 'stderr'].forEach(mode => {
            const oldLogger = process[mode].write;
            process[mode].write = function (msg, ...args) {
                oldLogger(msg, ...args);
                log(msg);
            };
        });

        // Initialize tray icon
        this.tray = new Tray(guiIcon);
        this.tray.setToolTip('Caali\'s Tera Proxy');
        this.tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Quit',
                click: () => { app.exit(); }
            }
        ]));

        this.tray.on('click', () => { this.window.isVisible() ? this.window.hide() : this.window.show(); });
    }

    hide() {
        if (this.window !== null)
            this.window.hide();
    }

    close() {
        if (this.window !== null) {
            StopProxy();

            this.window.close();
            this.window = null;
        }
    }

    showError(error) {
        if (this.window)
            this.window.webContents.send('error', error);
    }

    log(msg) {
        if (this.window)
            this.window.webContents.send('log', msg);
    }
}

// Main
let ModuleFolder;
let config;
let gui;

function showError(error) {
    console.log(error);
    if (gui)
        gui.showError(error);
}

function log(msg) {
    if (gui)
        gui.log(msg);
}

module.exports = function LoaderGUI(ModFolder, ProxyConfig, ProxyRegionConfig) {
    // Enforce single instance of GUI
    if (!app.requestSingleInstanceLock()) {
        app.quit();
        return;
    } else {
        app.on('second-instance', () => {
            if (gui)
                gui.show();
        });
    }

    // Boot GUI
    global.TeraProxy.GUIMode = true;

    ModuleFolder = ModFolder;
    config = ProxyConfig;
    if (!config.gui) {
        config.gui = {
            enabled: true,
            theme: 'black',
            autostart: false
        };

        SaveConfiguration(config);
    } else {
        if (config.gui.logtimes === undefined) {
            config.gui.logtimes = true;
            SaveConfiguration(config);
        }

        global.TeraProxy.GUITheme = ProxyConfig.gui.theme || 'black';
    }

    gui = new TeraProxyGUI;

    if (app.isReady()) {
        gui.show();
    } else {
        app.on('ready', () => {
            gui.show();
        });
    }

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin')
            app.quit();
    });

    app.on('activate', () => {
        gui.show();
    });
};
