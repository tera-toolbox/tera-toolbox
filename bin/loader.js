const fs = require("fs");
const path = require("path");

const DiscordURL = "https://discord.gg/dUNDDtw";
const ModuleFolder = path.join(__dirname, "..", "mods");

// Load and validate configuration
function LoadConfiguration() {
    try {
        return require('./config').loadConfig();
    } catch (_) {
        console.log("ERROR: Whoops, looks like you've fucked up your config.json!");
        console.log("ERROR: Try to fix it yourself or ask in the #help channel of %s!", DiscordURL);
        process.exit(1);
    }
}

// Check node/electron version
function NodeVersionCheck() {
    let BigIntSupported = false;
    try { BigIntSupported = eval('1234n === 1234n'); } catch (_) { }

    if (['11.0.0', '11.1.0', '11.2.0', '11.3.0'].includes(process.versions.node)) {
        console.error('ERROR: Node.JS 11.0 to 11.3 contain critical bugs preventing timers from working properly. Please install version 11.4 or later!');
        process.exit();
    } else if (process.versions.modules < 64 || !BigIntSupported) {
        if (!!process.versions.electron) {
            console.error('ERROR: Your version of Electron is too old to run tera-proxy!');
            console.error('ERROR: If you are using Arborean Apparel, download the latest release from:');
            console.error('ERROR: https://github.com/iribae/arborean-apparel/releases');
            console.error('ERROR: Otherwise, please ask in the #help channel of %s!', DiscordURL);
        } else {
            console.error('ERROR: Your installed version of Node.JS is too old to run tera-proxy!');
            console.error('ERROR: Please install the latest version from https://nodejs.org/en/download/current/');
        }
        process.exit();
    }
}

// Migrate from old proxy versions
function ProxyMigration() {
    const oldLibFolder = path.join(__dirname, 'lib');
    const isOldStructure = fs.existsSync(oldLibFolder);
    if(!isOldStructure)
        return;

    // Migrate config.json
    try {
        fs.renameSync(path.join(__dirname, 'config.json'), path.join(__dirname, '..', 'config.json'));
    } catch (e) {
        console.log("ERROR: Unable to migrate your proxy settings!");
        console.log("ERROR: Try to move them yourself or ask in the #help channel of %s!", DiscordURL);
        console.log(e);
        process.exit(1);
    }

    // Migrate servers
    try {
        const oldServersFolder = path.join(oldLibFolder, 'res');
        const newServersFolder = path.join(__dirname, 'servers');

        fs.readdirSync(oldServersFolder).forEach( entry => fs.renameSync(path.join(oldServersFolder, entry), path.join(newServersFolder, entry)) );
        fs.rmdirSync(oldServersFolder);
    } catch (e) {
        console.log("ERROR: Unable to migrate your server settings!");
        console.log("ERROR: Try to move them yourself or ask in the #help channel of %s!", DiscordURL);
        console.log(e);
        process.exit(1);
    }

    // Migrate module folder
    const ModuleFolderOld = path.join(__dirname, "node_modules");
    if (fs.existsSync(ModuleFolderOld)) {
        console.log("-------------------------------------------------------");
        console.log("--------------- IMPORTANT INFORMATION -----------------");
        console.log("-------------------------------------------------------");
        console.log("Proxy's folder containing installed mods was moved from");
        console.log("          [proxy folder]/bin/node_modules/             ");
        console.log("                        to                             ");
        console.log("               [proxy folder]/mods/                    ");
        console.log("-------------------------------------------------------");

        try {
            fs.renameSync(ModuleFolderOld, ModuleFolder);
            console.log("  All installed mods were automatically moved for you. ");
            console.log("        No further manual action is required.          ");
            console.log("-------------------------------------------------------");
        } catch (e) {
            console.log("ERROR: Unable to automatically migrate modules folder!");
            console.log("ERROR: Try to move it yourself or ask in the #help channel of %s!", DiscordURL);
            console.log("-------------------------------------------------------");
            console.log(e);
            process.exit(1);
        }
    }

    // Delete leftover files
    try {
        fs.readdirSync(oldLibFolder).forEach( entry => fs.unlinkSync(path.join(oldLibFolder, entry)) );
        fs.rmdirSync(oldLibFolder);
    } catch (_) {}
}

// Load region
function LoadRegion(region) {
    try {
        return require('./config').loadRegion(region);
    } catch (e) {
        console.log(`ERROR: Unable to load region information: ${e}`);
        console.log("ERROR: Try to fix it yourself or ask in the #help channel of %s!", DiscordURL);
        process.exit(1);
    }
}

// Migrate region files
function RegionMigration(region) {
    const { customServers } = region.data;

    let migratedFile = null;
    switch (region.id) {
        case "EU": {
            if (customServers["30"] || customServers["31"] || customServers["32"] || customServers["33"] || customServers["34"] || customServers["35"])
                migratedFile = "servers/servers-eu.json";
            break;
        }
        case "TH": {
            if (customServers["2"] || !customServers["1"])
                migratedFile = "servers/servers-th.json";
            break;
        }
        case "JP": {
            if (!customServers["5073"])
                migratedFile = "servers/servers-jp.json";
            break;
        }
    }

    if (migratedFile) {
        try {
            fs.unlinkSync(path.join(__dirname, migratedFile));
            console.log(`Due to a change in the server list by the publisher, your server configuration for region ${region.id} was reset. Please restart proxy for the changes to take effect!`);
        } catch (e) {
            console.log(`ERROR: Unable to migrate server list for region ${region.id}: ${e}`);
        }
        process.exit(1);
    }
}

// Runs proxy
function RunProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig) {
    const TeraProxy = require('./proxy');
    let proxy = new TeraProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
    proxy.run();

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
NodeVersionCheck();
ProxyMigration();
const ProxyConfig = LoadConfiguration();
const ProxyRegionConfig = LoadRegion(ProxyConfig.region);
RegionMigration(ProxyRegionConfig);

const autoUpdate = require("./update");
autoUpdate(ModuleFolder, ProxyConfig.updatelog, true, ProxyRegionConfig.idShort).then(updateResult => {
    for (let mod of updateResult["legacy"])
        console.log("[update] WARNING: Module %s does not support auto-updating!", mod.name);
    for (let mod of updateResult["failed"])
        console.log("[update] ERROR: Module %s could not be updated and might be broken!", mod.name);
    if (!updateResult["tera-data"])
        console.log("[update] ERROR: There were errors updating tera-data. This might result in further errors.");

    delete require.cache[require.resolve("tera-data-parser")];
    delete require.cache[require.resolve("tera-proxy-game")];

    RunProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
}).catch(e => {
    console.log("ERROR: Unable to auto-update: %s", e);
});
