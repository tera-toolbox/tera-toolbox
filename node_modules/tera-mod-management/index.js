const fs = require('fs');
const path = require('path');

const CoreModules = {
    "command": "https://raw.githubusercontent.com/tera-toolbox/command/master/module.json",
    "tera-game-state": "https://raw.githubusercontent.com/tera-toolbox/tera-game-state/master/module.json",
};

// Installed module management
function installModule(rootFolder, installInfo, nameOverride = null) {
    const modName = nameOverride || installInfo.name;
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
        'category': 'network',
        'author': null,
        'description': null,
        'version': null,
        'donationUrl': null,
        'options': {},
        'drmKey': null,
        'supportUrl': null,
        'disabled': false,
        'disableAutoUpdate': null,
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
                'category': moduleInfo.category || result.category,
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
                'disableAutoUpdate': !!moduleInfo.disableAutoUpdate,
                'disabled': !!moduleInfo.disabled,
            });

            if (!['network', 'client'].includes(result.category))
                throw new Error(`Invalid mod category ${result.category}`);

            // Try to load required defs from manifest
            if (moduleInfo.category === 'network') {
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

            // Try to load module config
            let moduleConfig = null;
            try {
                moduleConfig = fs.readFileSync(path.join(modulePath, 'module.config.json'), 'utf8');
            } catch (_) {
                // Ignore
            }

            if (moduleConfig) {
                moduleConfig = JSON.parse(moduleConfig);
                result.disabled = moduleConfig.disabled !== undefined ? moduleConfig.disabled : result.disabled;
                result.disableAutoUpdate = moduleConfig.disableAutoUpdate !== undefined ? moduleConfig.disableAutoUpdate : result.disableAutoUpdate;
                result.drmKey = (moduleConfig.drmKey !== undefined && moduleConfig.drmKey !== null) ? moduleConfig.drmKey : result.drmKey;
            }
        }
    }

    // Post-process data
    result.isCoreModule = isCoreModule(result);
    return result;
}


// Module auto update settings management
function _loadModuleConfigFile(moduleInfo) {
    if (moduleInfo.compatibility !== 'compatible')
        throw new TypeError(`Trying to change configuration for incompatible module ${moduleInfo.name}!`);

    try {
        return JSON.parse(fs.readFileSync(path.join(moduleInfo.path, 'module.config.json'), 'utf8'));
    } catch (e) {
        let res = {};
        res.disabled = !!moduleInfo.disabled;
        res.disableAutoUpdate = !!moduleInfo.disableAutoUpdate;
        // Note: we explicitly do not want to set drmKey here, in order to stay compatible with mods that specify it in module.json
        return res;
    }
}

function _storeModuleConfigFile(moduleInfo, data) {
    if (moduleInfo.compatibility !== 'compatible')
        throw new TypeError(`Trying to change configuration for incompatible module ${moduleInfo.name}!`);

    fs.writeFileSync(path.join(moduleInfo.path, 'module.config.json'), JSON.stringify(data, null, 4));
}


function setAutoUpdateEnabled(moduleInfo, enabled) {
    let moduleConfigFile = _loadModuleConfigFile(moduleInfo);
    moduleConfigFile.disableAutoUpdate = !enabled;
    _storeModuleConfigFile(moduleInfo, moduleConfigFile);
}

function enableAutoUpdate(moduleInfo) {
    setAutoUpdateEnabled(moduleInfo, true);
}

function disableAutoUpdate(moduleInfo) {
    setAutoUpdateEnabled(moduleInfo, false);
}

function toggleAutoUpdate(moduleInfo) {
    setAutoUpdateEnabled(moduleInfo, moduleInfo.disableAutoUpdate);
}


function setLoadEnabled(moduleInfo, enabled) {
    let moduleConfigFile = _loadModuleConfigFile(moduleInfo);
    moduleConfigFile.disabled = !enabled;
    _storeModuleConfigFile(moduleInfo, moduleConfigFile);
}

function enableLoad(moduleInfo) {
    setLoadEnabled(moduleInfo, true);
}

function disableLoad(moduleInfo) {
    setLoadEnabled(moduleInfo, false);
}

function toggleLoad(moduleInfo) {
    setLoadEnabled(moduleInfo, moduleInfo.disabled);
}


module.exports = { CoreModules, isCoreModule, listModules, listModuleInfos, loadModuleInfo, installModule, uninstallModule, setAutoUpdateEnabled, enableAutoUpdate, disableAutoUpdate, toggleAutoUpdate, setLoadEnabled, enableLoad, disableLoad, toggleLoad };
