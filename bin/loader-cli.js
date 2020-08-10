const path = require('path');
const DataFolder = path.join(__dirname, '..', 'data');
const ModuleFolder = path.join(__dirname, '..', 'mods');

// MUI
const mui = require('tera-toolbox-mui').DefaultInstance;

function InitializeMUI(language) {
    const { InitializeDefaultInstance } = require('tera-toolbox-mui');
    InitializeDefaultInstance(language);
}

// Check node version
function NodeVersionCheck() {
    const { checkRuntimeCompatibility } = require('./utils');

    try {
        checkRuntimeCompatibility();
        return true;
    } catch (e) {
        switch (e.message) {
            case 'NodeTooOld':
                console.error(mui.get('loader-cli/error-node-too-old-1'));
                console.error(mui.get('loader-cli/error-node-too-old-2'));
                break;
            default:
                console.error(mui.get('loader-cli/error-runtime-incompatible-default', { message: e.message }));
        }

        return false;
    }
}

// Load and validate configuration
function LoadConfiguration() {
    try {
        return require('./config').loadConfig();
    } catch (e) {
        console.error(mui.get('loader-cli/error-config-corrupt-1'));
        console.error(mui.get('loader-cli/error-config-corrupt-2', { supportUrl: global.TeraProxy.SupportUrl }));
        return null;
    }
}

// Migration
function Migration() {
    try {
        const { ToolboxMigration } = require('./migration');
        ToolboxMigration();
        return true;
    } catch (e) {
        console.error(mui.get('loader-cli/error-migration-failed-1'));
        console.error(mui.get('loader-cli/error-migration-failed-2'));
        console.error(mui.get('loader-cli/error-migration-failed-3', { supportUrl: global.TeraProxy.SupportUrl }));
        return false;
    }
}

// Proxy main function
function RunProxy(ModuleFolder, ProxyConfig) {
    const TeraProxy = require('./proxy');
    let proxy = new TeraProxy(ModuleFolder, DataFolder, ProxyConfig);
    try {
        // Switch to highest process priority so we don't starve because of game client using all CPU
        const { setHighestProcessPriority } = require("./utils");
        setHighestProcessPriority();

        // Start proxy
        proxy.run();
    } catch (e) {
        console.error(mui.get('loader-cli/error-cannot-start-proxy'));
        throw e;
    }

    // Set up clean exit
    const isWindows = process.platform === 'win32';

    function cleanExit() {
        console.log(mui.get('loader-cli/terminating'));

        proxy.destructor();
        proxy = null;

        if (isWindows)
            process.stdin.pause();
    }

    if (isWindows) {
        require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        }).on('SIGINT', () => process.emit('SIGINT'));
    }

    process.on('SIGHUP', cleanExit);
    process.on('SIGINT', cleanExit);
    process.on('SIGTERM', cleanExit);
}

// Main
process.on('warning', (warning) => {
    console.warn(warning.name);
    console.warn(warning.message);
    console.warn(warning.stack);
});

const { initGlobalSettings } = require('./utils');
initGlobalSettings(false).then(() => {
    if (NodeVersionCheck()) {
        if (Migration()) {
            const ProxyConfig = LoadConfiguration();
            if (ProxyConfig !== null) {
                InitializeMUI(ProxyConfig.uilanguage);
                global.TeraProxy.DevMode = !!ProxyConfig.devmode;
                global.TeraProxy.GUIMode = false;
                    
                // Auto-update mods and run
                if (ProxyConfig.noupdate) {
                    console.warn(mui.get('loader-cli/warning-noupdate-1'));
                    console.warn(mui.get('loader-cli/warning-noupdate-2'));
                    console.warn(mui.get('loader-cli/warning-noupdate-3'));
                    console.warn(mui.get('loader-cli/warning-noupdate-4'));
                    console.warn(mui.get('loader-cli/warning-noupdate-5'));
                    RunProxy(ModuleFolder, ProxyConfig);
                } else {
                    const autoUpdate = require('./update');
                    autoUpdate(ModuleFolder, ProxyConfig.updatelog, true).then(updateResult => {
                        updateResult.legacy.forEach(mod => console.warn(mui.get('loader-cli/warning-update-mod-not-supported', { name: mod.name })));
                        updateResult.failed.forEach(mod => console.error(mui.get('loader-cli/error-update-mod-failed', { name: mod.name })));

                        RunProxy(ModuleFolder, ProxyConfig);
                    }).catch(e => {
                        console.error(mui.get('loader-cli/error-update-failed'));
                        console.error(e);
                    });
                }
            }
        }
    }
}).catch(e => {
    console.error(e);
});
