const fs = require("fs");
const path = require("path");
const ModuleFolder = path.join(__dirname, "..", "mods");

// Check node/electron version
function NodeVersionCheck() {
    const { checkRuntimeCompatibility } = require('./utils');

    try {
        checkRuntimeCompatibility();
    } catch (e) {
        switch (e.message) {
            case 'BigInt not supported':
                if (!!process.versions.electron) {
                    console.error('ERROR: Your version of Electron is too old to run tera-proxy!');
                    console.error(`ERROR: Please download the latest proxy installer from ${global.TeraProxy.SupportUrl}!`);
                } else {
                    console.error('ERROR: Your installed version of Node.JS is too old to run tera-proxy!');
                    console.error('ERROR: Please install the latest version from https://nodejs.org/en/download/current/');
                }
                break;

            default:
                console.error(`ERROR: ${e.message}`);
        }

        process.exit();
    }
}

// Load and validate configuration
function LoadConfiguration() {
    try {
        return require('./config').loadConfig();
    } catch (_) {
        console.log("ERROR: Whoops, looks like you've fucked up your config.json!");
        console.log(`ERROR: Try to fix it yourself or ask here: ${global.TeraProxy.SupportUrl}!`);
        process.exit(1);
    }
}

// Migrate from old proxy versions
function ProxyMigration() {
    // Delete legacy servers folder
    try {
        const serversFolder = path.join(__dirname, 'servers');
        fs.readdirSync(serversFolder).forEach(entry => fs.unlinkSync(path.join(serversFolder, entry)));
        fs.rmdirSync(serversFolder);
    } catch (e) {
        // Ignore
    }

    // Delete legacy tera-proxy-sls folder
    try {
        const slsFolder = path.join(__dirname, '..', 'node_modules', 'tera-proxy-sls');
        const slsResFolder = path.join(slsFolder, 'res');
        fs.readdirSync(slsResFolder).forEach(entry => fs.unlinkSync(path.join(slsResFolder, entry)));
        fs.rmdirSync(slsResFolder);

        fs.readdirSync(slsFolder).forEach(entry => fs.unlinkSync(path.join(slsFolder, entry)));
        fs.rmdirSync(slsFolder);
    } catch (e) {
        // Ignore
    }

    // Delete no longer used files
    try {
        fs.unlinkSync(path.join(__dirname, "hosts.js"));
        fs.unlinkSync(path.join(__dirname, "netstat.js"));
        fs.unlinkSync(path.join(__dirname, "regions.js"));
    } catch (e) {
        // Ignore
    }
}

// Main
const { initGlobalSettings } = require('./utils');
initGlobalSettings(false);
NodeVersionCheck();
ProxyMigration();
const ProxyConfig = LoadConfiguration();
global.TeraProxy.DevMode = !!ProxyConfig.devmode;

// Pass control to second-stage loader
const SecondStageLoader = require(process.versions.electron ? './loader-gui' : './loader-console');
SecondStageLoader(ModuleFolder, ProxyConfig);
