const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const ModuleFolder = path.join(__dirname, "..", "mods");

// Configuration
function LoadConfiguration() {
    try {
        return require('./config').loadConfig();
    } catch (_) {
        const { dialog } = require('electron');

        dialog.showMessageBox({
            type: 'error',
            title: 'Invalid settings file!',
            message: `The config.json file in your proxy folder is malformed. Try to fix it yourself, delete it to generate a new one, or ask in ${global.TeraProxy.SupportUrl} for help!\n\nProxy will now be terminated.`
        });

        app.quit();
    }
}

function SaveConfiguration(newConfig) {
    global.TeraProxy.DevMode = !!newConfig.devmode;
    global.TeraProxy.GUITheme = newConfig.gui.theme;
    require('./config').saveConfig(newConfig);
}

// Migration
function Migration() {
    try {
        const { ProxyMigration } = require('./migration');
        ProxyMigration();
    } catch (e) {
        const { dialog } = require('electron');

        dialog.showMessageBox({
            type: 'error',
            title: 'Migration error!',
            message: `Unable to migrate files from an old version of Tera-Proxy.\nPlease reinstall a clean copy using the latest installer or ask in ${global.TeraProxy.SupportUrl} for help!\n\nProxy will now be terminated.`
        });

        app.quit();
    }
}

// Installed mod management
const AvailableModuleListUrl = "https://raw.githubusercontent.com/caali-hackerman/tera-mods/master/modulelist.json";
const { listModuleInfos, installModule, uninstallModule, toggleAutoUpdate, toggleLoad } = require('tera-proxy-game').ModuleInstallation;

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
let proxyRunning = false;
function _StartProxy(ModuleFolder, ProxyConfig) {
    if (proxy || proxyRunning)
        return false;

    const TeraProxy = require('./proxy');
    proxy = new TeraProxy(ModuleFolder, ProxyConfig);
    try {
        proxy.run();
        proxyRunning = true;
        return true;
    } catch (_) {
        console.error('[proxy] Unable to start proxy!');
        proxy = null;
        proxyRunning = false;
        return false;
    }
}

async function StartProxy(ModuleFolder, ProxyConfig) {
    if (proxy || proxyRunning)
        return false;

    if (ProxyConfig.noupdate) {
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        log("!!!!!      YOU HAVE GLOBALLY DISABLED AUTOMATIC UPDATES     !!!!!");
        log("!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
        log("!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return _StartProxy(ModuleFolder, ProxyConfig);
    } else {
        const autoUpdate = require("./update");

        try {
            const updateResult = await autoUpdate(ModuleFolder, ProxyConfig.updatelog, true);

            for (let mod of updateResult["legacy"])
                log(`[update] WARNING: Module ${mod.name} does not support auto-updating!`);
            for (let mod of updateResult["failed"])
                log(`[update] ERROR: Module ${mod.name} could not be updated and might be broken!`);
            if (!updateResult["tera-data"])
                log("[update] ERROR: There were errors updating tera-data. This might result in further errors.");

            delete require.cache[require.resolve("tera-data-parser")];
            delete require.cache[require.resolve("tera-proxy-game")];

            return _StartProxy(ModuleFolder, ProxyConfig);
        } catch (e) {
            log(`ERROR: Unable to auto-update: ${e}`);
            return false;
        }
    }
}

async function StopProxy() {
    if (!proxy || !proxyRunning)
        return false;

    proxy.destructor();
    proxy = null;
    proxyRunning = false;
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
        StartProxy(ModuleFolder, config).then((result) => {
            event.sender.send('proxy running', result);
        });
    }
});

ipcMain.on('start proxy', (event, _) => {
    if (proxy || proxyRunning)
        return;

    log("Starting proxy...");
    StartProxy(ModuleFolder, config).then((result) => {
        event.sender.send('proxy running', result);
    });
});

ipcMain.on('stop proxy', (event, _) => {
    if (!proxy || !proxyRunning)
        return;

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

ipcMain.on('toggle mod load', (event, modInfo) => {
    toggleLoad(modInfo);
    log(`${modInfo.disabled ? 'Enabled' : 'Disabled'} "${modInfo.rawName}"`);
    event.sender.send('set mods', listModuleInfos(ModuleFolder));
});

ipcMain.on('toggle mod autoupdate', (event, modInfo) => {
    toggleAutoUpdate(modInfo);
    log(`${modInfo.disableAutoUpdate ? 'Enabled' : 'Disabled'} automatic updates for "${modInfo.rawName}"`);
    event.sender.send('set mods', listModuleInfos(ModuleFolder));
});

ipcMain.on('uninstall mod', (event, modInfo) => {
    uninstallModule(modInfo);
    log(`Uninstalled "${modInfo.rawName}"`);
    event.sender.send('set mods', listModuleInfos(ModuleFolder));
});

ipcMain.on('show mods folder', () => {
    shell.openItem(ModuleFolder);
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

        // Migration
        Migration();

        // Load configuration
        config = LoadConfiguration();
        global.TeraProxy.GUIMode = true;
        global.TeraProxy.DevMode = !!config.devmode;

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

            global.TeraProxy.GUITheme = config.gui.theme || 'black';
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
let config;
let gui;

function showError(error) {
    console.log(error);
    if (gui)
        gui.showError(error);
}

function log(msg) {
    if (msg.length === 0)
        return;

    if (gui)
        gui.log(msg);
}

process.on('warning', (warning) => {
    log(warning.name);
    log(warning.message);
    log(warning.stack);
});

// Main
const { initGlobalSettings } = require('./utils');
initGlobalSettings(false);

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

