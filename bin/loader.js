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
                    console.error('ERROR: If you are using Arborean Apparel, download the latest release from:');
                    console.error('ERROR: https://github.com/iribae/arborean-apparel/releases');
                    console.error(`ERROR: Otherwise, please ask here: ${global.TeraProxy.SupportUrl}!`);
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
    const oldLibFolder = path.join(__dirname, 'lib');
    const oldConfig = path.join(__dirname, 'config.json');
    const isOldStructure = fs.existsSync(oldLibFolder) && fs.existsSync(oldConfig);
    if(!isOldStructure)
        return;

    // Migrate config.json
    try {
        fs.renameSync(oldConfig, path.join(__dirname, '..', 'config.json'));
    } catch (e) {
        console.log("[update] ERROR: Unable to migrate your proxy settings!");
        console.log(`[update] ERROR: Try to move them yourself or ask here: ${global.TeraProxy.SupportUrl}!`);
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
        console.log("[update] ERROR: Unable to migrate your server settings!");
        console.log(`[update] ERROR: Try to move them yourself or ask here: ${global.TeraProxy.SupportUrl}!`);
        console.log(e);
        process.exit(1);
    }

    // Migrate module folder
    const ModuleFolderOld = path.join(__dirname, "node_modules");
    if (fs.existsSync(ModuleFolderOld)) {
        console.log("[update] -------------------------------------------------------");
        console.log("[update] --------------- IMPORTANT INFORMATION -----------------");
        console.log("[update] -------------------------------------------------------");
        console.log("[update] Proxy's folder containing installed mods was moved from");
        console.log("[update]           [proxy folder]/bin/node_modules/             ");
        console.log("[update]                         to                             ");
        console.log("[update]                [proxy folder]/mods/                    ");
        console.log("[update] -------------------------------------------------------");

        try {
            fs.renameSync(ModuleFolderOld, ModuleFolder);
            console.log("[update]   All installed mods were automatically moved for you. ");
            console.log("[update]         No further manual action is required.          ");
            console.log("[update] -------------------------------------------------------");
        } catch (e) {
            console.log("[update] ERROR: Unable to automatically migrate modules folder!");
            console.log(`[update] ERROR: Try to move it yourself or ask here: ${global.TeraProxy.SupportUrl}!`);
            console.log("[update] -------------------------------------------------------");
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
        console.log(`ERROR: Try to fix it yourself or ask here: ${global.TeraProxy.SupportUrl}!`);
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
        case "NA": {
            if (customServers["4004"] || customServers["4009"] || customServers["4012"] || customServers["4024"] || customServers["4032"])
                migratedFile = "servers/servers-na.json";
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
            console.log(`[update] Due to a change in the server list by the publisher, your server configuration for region ${region.id} was reset.`);
            console.log('[update] Please restart proxy for the changes to take effect!');
        } catch (e) {
            console.log(`[update] ERROR: Unable to migrate server list for region ${region.id}: ${e}`);
        }
        process.exit(1);
    }
}

// Migrate modules
function ModuleMigration(ModuleFolder) {
    const { listModuleInfos, installModule, uninstallModule } = require('tera-proxy-game').ModuleInstallation;

    // Migrate swim-fix and chat-sanitizer to bugfix
    let BugfixModules = [];
    let BugfixInstalled = false;
    listModuleInfos(ModuleFolder).forEach(modInfo => {
        if(['swim-fix', 'swim-fix.js', 'chat-sanitizer', 'chat-sanitizer.js'].includes(modInfo.name) || ((modInfo.name === 'bugfix' || modInfo.name === 'bugfix-master') && modInfo.compatibility !== 'compatible')) {
            BugfixModules.push(modInfo.name);
            uninstallModule(modInfo);
        }

        if (modInfo.name === 'bugfix' && modInfo.compatibility === 'compatible')
            BugfixInstalled = true;
    });

    if(BugfixModules.length > 0) {
        if (BugfixInstalled) {
            console.log('[update] The following installed modules have been automatically uninstalled because they');
            console.log('[update] are already included in the installed "bugfix" module:');
            BugfixModules.forEach(mod => console.log(`[update]  - ${mod}`));
        } else {
            console.log('[update] The following installed modules have been automatically converted into the new "bugfix" module:');
            BugfixModules.forEach(mod => console.log(`[update]  - ${mod}`));
            installModule(ModuleFolder, {"name": "bugfix", "servers": ["https://raw.githubusercontent.com/caali-hackerman/bugfix/master/"]});
        }
    }

    // Migrate instant-xxxxx mods to instant-everything
    let InstantModules = [];
    let InstantEverythingInstalled = false;
    listModuleInfos(ModuleFolder).forEach(modInfo => {
        if(['instant-soulbind', 'instant-soulbind-master', 'instant-soulbind.js',
            'instant-enchant', 'instant-enchant-master', 'instant-enchant.js',
            'instant-upgrade', 'instant-upgrade-master', 'instant-upgrade.js',
            'instant-merge', 'instant-merge-master', 'instant-merge.js',
            'instant-dismantle', 'instant-dismantle-master', 'instant-dismantle.js'].includes(modInfo.name)) {
            InstantModules.push(modInfo.name);
            uninstallModule(modInfo);
        }

        if (modInfo.name === 'instant-everything' && modInfo.compatibility === 'compatible')
            InstantEverythingInstalled = true;
    });

    if(InstantModules.length > 0) {
        if (InstantEverythingInstalled) {
            console.log('[update] The following installed modules have been automatically uninstalled because they');
            console.log('[update] are already included in the installed "instant-everything" module:');
            InstantModules.forEach(mod => console.log(`[update]  - ${mod}`));
        } else {
            console.log('[update] The following installed modules have been automatically converted into the new "instant-everything" module:');
            InstantModules.forEach(mod => console.log(`[update]  - ${mod}`));
            console.log('[update] Enter "/8 instant" in the chat to see a list of toggleable features. Use "/8 instant [feature]" to toggle them.');
            installModule(ModuleFolder, {"name": "instant-everything", "servers": ["https://raw.githubusercontent.com/caali-hackerman/instant-everything/master/"]});
        }
    }
}

// Main
const { initGlobalSettings } = require('./utils');
initGlobalSettings(false);
NodeVersionCheck();
ProxyMigration();
const ProxyConfig = LoadConfiguration();
global.TeraProxy.DevMode = !!ProxyConfig.devmode;
const ProxyRegionConfig = LoadRegion(ProxyConfig.region);
RegionMigration(ProxyRegionConfig);
ModuleMigration(ModuleFolder);

// Pass control to second-stage loader
const SecondStageLoader = require(!!process.versions.electron ? './loader-gui' : './loader-console');
SecondStageLoader(ModuleFolder, ProxyConfig, ProxyRegionConfig);
