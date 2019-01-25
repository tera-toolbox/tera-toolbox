const fs = require('fs');
const path = require('path');

const CoreModules = {
    "command": "https://raw.githubusercontent.com/caali-hackerman/command/master/module.json",
    "tera-game-state": "https://raw.githubusercontent.com/caali-hackerman/tera-game-state/master/module.json",
};

// Installed module management
function installModule(rootFolder, installInfo, nameOverride = null) {
    const modName = installInfo.name || nameOverride;
    const modFolder = path.join(rootFolder, modName);
    fs.mkdirSync(modFolder);
    fs.writeFileSync(path.join(modFolder, 'module.json'), JSON.stringify(installInfo, null, 4));
}

function uninstallModule(moduleInfo) {
    function rmdirSyncForce(dir_path) {
        if (!fs.existsSync(dir_path))
            return;

        fs.readdirSync(dir_path).forEach(entry => {
            const entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory())
                rmdirSyncForce(entry_path);
            else
                fs.unlinkSync(entry_path);
        });
        fs.rmdirSync(dir_path);
    }

    if (moduleInfo.type === 'standalone')
        fs.unlinkSync(moduleInfo.path);
    else
        rmdirSyncForce(moduleInfo.path);
}

function isCoreModule(moduleInfo) {
    return CoreModules.hasOwnProperty(moduleInfo.name);
}

function listModules(rootFolder) {
    let names = [];

    for (let name of fs.readdirSync(rootFolder)) {
        if (name[0] === "." || name[0] === "_")
            continue;
        if (!name.endsWith(".js") && !fs.lstatSync(path.join(rootFolder, name)).isDirectory())
            continue;

        names.push(name);
    }

    return names;
}

function listModuleInfos(rootFolder) {
    return listModules(rootFolder).map(mod => {
        try {
            return loadModuleInfo(rootFolder, mod);
        } catch (_) {
            return null;
        }
    }).filter(mod => mod !== null);
}

function loadModuleInfo(rootFolder, name) {
    const modulePath = path.join(rootFolder, name);

    let result = {
        'name': name.toLowerCase(),
        'rawName': name,
        'path': modulePath,
        'author': null,
        'description': null,
        'version': null,
        'donationUrl': null,
        'options': {},
        'drmKey': null,
        'supportUrl': null,
        'disabled': false,
        'autoUpdateDisabled': null,
        'dependencies': [],
        'conflicts': [],
        'packets': {},
    };

    const standalone = !fs.lstatSync(modulePath).isDirectory();
    if (standalone) {
        if (!name.endsWith(".js"))
            throw new Error(`Invalid mod ${name}`);

        // Standalone legacy mod
        Object.assign(result, {
            'type': 'standalone',
            'compatibility': 'legacy',
        });
    } else {
        // Try to load module information and manifest files
        let moduleInfo = null;
        try {
            moduleInfo = fs.readFileSync(path.join(modulePath, 'module.json'), 'utf8');
        } catch (_) {
            // Files not found, so regular legacy mod
            Object.assign(result, {
                'type': 'regular',
                'compatibility': 'legacy',
            });
        }

        // Parse and load module information
        if (moduleInfo) {
            moduleInfo = JSON.parse(moduleInfo);

            Object.assign(result, {
                'type': 'regular',
                'compatibility': 'compatible',
                'name': (moduleInfo.name || result.name).toLowerCase(),
                'rawName': moduleInfo.name || result.rawName,
                'author': moduleInfo.author || result.author,
                'description': moduleInfo.description || result.description,
                'version': moduleInfo.version || result.version,
                'donationUrl': moduleInfo.donationUrl || result.donationUrl,
                'options': moduleInfo.options || result.options,
                'drmKey': moduleInfo.drmKey || result.drmKey,
                'supportUrl': moduleInfo.supportUrl || result.supportUrl,
                'dependencies': moduleInfo.dependencies ? Object.keys(moduleInfo.dependencies) : result.dependencies,
                'conflicts': moduleInfo.conflicts || result.conflicts,
                'autoUpdateDisabled': !!moduleInfo.disableAutoUpdate,
                'disabled': !!moduleInfo.disabled,
            });

            // Try to load required defs from manifest
            let moduleManifest = null;
            try {
                moduleManifest = fs.readFileSync(path.join(modulePath, 'manifest.json'), 'utf8');
            } catch (_) {
                // Ignore
            }

            if (moduleManifest) {
                moduleManifest = JSON.parse(moduleManifest);
                result.packets = moduleManifest.defs || result.packets;
            }
        }
    }

    // Post-process data
    if (!result.options.loadOn)
        result.options.loadOn = 'versioncheck';
    result.isCoreModule = isCoreModule(result);
    return result;
}


// Module auto update settings management
function _loadModuleInfoFile(moduleInfo) {
    if (moduleInfo.compatibility !== 'compatible')
        throw new TypeError(`Trying to change auto update mode for incompatible module ${moduleInfo.name}!`);

    return JSON.parse(fs.readFileSync(path.join(moduleInfo.path, 'module.json'), 'utf8'));
}

function _storeModuleInfoFile(moduleInfo, data) {
    if (moduleInfo.compatibility !== 'compatible')
        throw new TypeError(`Trying to change auto update mode for incompatible module ${moduleInfo.name}!`);

    fs.writeFileSync(path.join(moduleInfo.path, 'module.json'), JSON.stringify(data, null, 4));
}

function setAutoUpdateEnabled(moduleInfo, enabled) {
    let moduleInfoFile = _loadModuleInfoFile(moduleInfo);
    moduleInfoFile.disableAutoUpdate = !enabled;
    _storeModuleInfoFile(moduleInfo, moduleInfoFile);
}

function enableAutoUpdate(moduleInfo) {
    setAutoUpdateEnabled(moduleInfo, true);
}

function disableAutoUpdate(moduleInfo) {
    setAutoUpdateEnabled(moduleInfo, false);
}

function toggleAutoUpdate(moduleInfo) {
    setAutoUpdateEnabled(moduleInfo, moduleInfo.autoUpdateDisabled);
}


module.exports = { CoreModules, isCoreModule, listModules, listModuleInfos, loadModuleInfo, installModule, uninstallModule, setAutoUpdateEnabled, enableAutoUpdate, disableAutoUpdate, toggleAutoUpdate };
