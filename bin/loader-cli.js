const path = require("path");
const ModuleFolder = path.join(__dirname, "..", "mods");

// Check node version
function NodeVersionCheck() {
    const { checkRuntimeCompatibility } = require('./utils');

    try {
        checkRuntimeCompatibility();
    } catch (e) {
        switch (e.message) {
            case 'BigInt not supported':
                console.error('ERROR: Your installed version of Node.JS is too old to run tera-proxy!');
                console.error('ERROR: Please install the latest version from https://nodejs.org/en/download/current/');
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
        process.exit();
    }
}

// Migration
function Migration() {
    try {
        const { ProxyMigration } = require('./migration');
        ProxyMigration();
    } catch (e) {
        console.log("ERROR: Unable to migrate files from an old version of tera-proxy!");
        console.log("ERROR: Please reinstall a clean copy using the latest installer");
        console.log(`ERROR: or ask for help here: ${global.TeraProxy.SupportUrl}!`);
        process.exit();
    }
}

// Proxy main function
function RunProxy(ModuleFolder, ProxyConfig) {
    const TeraProxy = require('./proxy');
    let proxy = new TeraProxy(ModuleFolder, ProxyConfig);
    try {
        proxy.run();
    } catch (_) {
        console.error('[proxy] Unable to start proxy, terminating...');
        process.exit();
    }

    // Set up clean exit
    const isWindows = process.platform === "win32";

    function cleanExit() {
        console.log("terminating...");

        proxy.destructor();
        proxy = null;

        if (isWindows)
            process.stdin.pause();
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
}

// Main
process.on('warning', (warning) => {
    console.warn(warning.name);
    console.warn(warning.message);
    console.warn(warning.stack);
});

const { initGlobalSettings } = require('./utils');
initGlobalSettings(false);
NodeVersionCheck();
Migration();
const ProxyConfig = LoadConfiguration();
global.TeraProxy.DevMode = !!ProxyConfig.devmode;
global.TeraProxy.GUIMode = false;

// Auto-update modules & tera-data and run
if (ProxyConfig.noupdate) {
    console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.warn("!!!!!      YOU HAVE GLOBALLY DISABLED AUTOMATIC UPDATES     !!!!!");
    console.warn("!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
    console.warn("!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
    console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    RunProxy(ModuleFolder, ProxyConfig);
} else {
    const autoUpdate = require("./update");
    autoUpdate(ModuleFolder, ProxyConfig.updatelog, true).then(updateResult => {
        for (let mod of updateResult["legacy"])
            console.log("[update] WARNING: Module %s does not support auto-updating!", mod.name);
        for (let mod of updateResult["failed"])
            console.log("[update] ERROR: Module %s could not be updated and might be broken!", mod.name);
        if (!updateResult["tera-data"])
            console.log("[update] ERROR: There were errors updating tera-data. This might result in further errors.");

        delete require.cache[require.resolve("tera-data-parser")];
        delete require.cache[require.resolve("tera-proxy-game")];

        RunProxy(ModuleFolder, ProxyConfig);
    }).catch(e => {
        console.log("ERROR: Unable to auto-update: %s", e);
    });
}
