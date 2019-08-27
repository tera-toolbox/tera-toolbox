const mui = require('tera-toolbox-mui').DefaultInstance;
const request = require('request-promise-native');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { CoreModules, listModuleInfos } = require('tera-mod-management');

const TeraDataAutoUpdateServer = "https://raw.githubusercontent.com/tera-toolbox/tera-data/beta/";

function forcedirSync(dir) {
    const sep = path.sep;
    const initDir = path.isAbsolute(dir) ? sep : '';
    dir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            // Ignore
        }

        return curDir;
    }, initDir);
}

function hash(data) {
    return crypto.createHash('sha256').update(data).digest().toString('hex').toUpperCase();
}

function walkdir(dir, listFiles = true, listDirs = false, listRootDir = "") {
    let results = [];
    fs.readdirSync(dir).forEach(function (file) {
        const fullpath = path.join(dir, file);
        const relpath = path.join(listRootDir, file);
        const stat = fs.statSync(fullpath);
        if (stat && stat.isDirectory()) {
            if (listDirs)
                results.push(relpath);
            results = results.concat(walkdir(fullpath, listFiles, listDirs, relpath));
        } else {
            if (listFiles)
                results.push(relpath);
        }
    });
    return results;
}

async function autoUpdateFile(file, filepath, url, drmKey, expectedHash = null) {
    try {
        const updatedFile = await request({ url: url, qs: { "drmkey": drmKey }, encoding: null });

        if (expectedHash && expectedHash !== hash(updatedFile))
            throw "ERROR: " + url + "\nDownloaded file doesn't match hash specified in patch manifest! Possible causes:\n   + Incorrect manifest specified by developer\n   + NoPing (if you're using it) has a bug that can fuck up the download";

        forcedirSync(path.dirname(filepath));
        fs.writeFileSync(filepath, updatedFile);
        return [file, true, ""];
    } catch (e) {
        return [file, false, e];
    }
}

function migrateModuleUpdateUrlRoot(update_url_root) {
    if (update_url_root === "https://raw.githubusercontent.com/caali-hackerman/tera-proxy/master/bin/node_modules/command/")
        return "https://raw.githubusercontent.com/caali-hackerman/command/master/";
    else
        return update_url_root.replace('https://simplesalt.feedia.co/update/', 'https://saltymonkey.online/update/');
}

let blacklist = [];
async function generateBlacklist() {
    blacklist = ["busann"];
}

function checkModuleUpdateUrlBlacklist(update_url_root) {
    // TODO: ... resolve this issue ...
    return !blacklist.some(name => update_url_root.toLowerCase().includes(`/${name}/`));
}

async function autoUpdateModule(name, root, updateData, updatelog, updatelimit, serverIndex = 0) {
    try {
        // If only one file (module.json) exists, it's a fresh install
        if (walkdir(root, true, false).length === 1)
            console.log(mui.get('update/start-module-install', { name }));
        else if (updatelog)
            console.log(mui.get('update/start-module-update', { name }));

        if (!updateData.servers || updateData.servers.length === 0) {
            console.warn(mui.get('update/warning-module-no-update-servers', { name }));
            return { results: [] };
        }

        const update_url_root = migrateModuleUpdateUrlRoot(updateData.servers[serverIndex]);
        if (!update_url_root || !checkModuleUpdateUrlBlacklist(update_url_root))
            return { results: [] };

        const manifest_file = 'manifest.json';
        const manifest_url = update_url_root + manifest_file;
        const manifest_path = path.join(root, manifest_file);
        if (updatelog)
            console.log(mui.get('update/module-download-manifest', { serverIndex }));

        let manifest_result = await autoUpdateFile(manifest_file, manifest_path, manifest_url, updateData["drmKey"], null);
        if (!manifest_result)
            throw new Error(`Unable to download update manifest for module "${name}":\n${e}`);

        let manifest;
        try {
            manifest = JSON.parse(fs.readFileSync(manifest_path, 'utf8'));
        } catch (e) {
            throw new Error(`Invalid update manifest for module "${name}":\n${e}`);
        }

        let promises = [];
        for (let file in manifest.files) {
            let filepath = path.join(root, file);
            let filedata = manifest.files[file];

            // Check if the file needs to be updated
            let needsUpdate = !fs.existsSync(filepath);
            let expectedHash = null;
            if (!needsUpdate) {
                if (typeof filedata === 'object') {
                    expectedHash = filedata.hash.toUpperCase();
                    needsUpdate = filedata.overwrite && (hash(fs.readFileSync(filepath)) !== expectedHash);
                } else {
                    expectedHash = filedata.toUpperCase();
                    needsUpdate = (hash(fs.readFileSync(filepath)) !== expectedHash);
                }
            }

            // Update file if required
            if (needsUpdate) {
                const file_url = update_url_root + file;
                if (updatelog)
                    console.log(mui.get('update/module-download-file', { file }));

                let promise = autoUpdateFile(file, filepath, file_url, updateData.drmKey, manifest.no_hash_verification ? null : expectedHash);
                promises.push(updatelimit ? (await promise) : promise);
            }
        }

        return { results: updatelimit ? promises : (await Promise.all(promises)) };
    } catch (e) {
        if (serverIndex + 1 < updateData.servers.length)
            return autoUpdateModule(name, root, updateData, updatelog, updatelimit, serverIndex + 1);
        else
            return Promise.reject(e);
    }
}

async function autoUpdateTeraData(updatelog, updatelimit) {
    if (updatelog)
        console.log(mui.get('update/tera-data'));

    const tera_data_folder = path.join(__dirname, '..', 'node_modules', 'tera-data');
    const manifest_file = 'manifest.json';
    const manifest_url = TeraDataAutoUpdateServer + manifest_file;
    const manifest_path = path.join(tera_data_folder, manifest_file);

    let manifest_result = await autoUpdateFile(manifest_file, manifest_path, manifest_url);
    if (!manifest_result)
        throw new Error(`Unable to download tera-data update manifest:\n${e}`);

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifest_path, 'utf8'));
    } catch (e) {
        throw new Error(`Invalid tera-data update manifest:\n${e}`);
    }

    let promises = [];
    // Maps
    for (const map in manifest.maps) {
        const map_custom_filename = path.join(tera_data_folder, 'map', map);
        if (!fs.existsSync(map_custom_filename)) {
            forcedirSync(path.dirname(map_custom_filename));
            fs.closeSync(fs.openSync(map_custom_filename, 'w'));
        }

        const map_filename = path.join(tera_data_folder, 'map_base', map);
        const expectedHash = manifest.maps[map].toUpperCase();
        if (!fs.existsSync(map_filename) || hash(fs.readFileSync(map_filename)) !== expectedHash) {
            if (updatelog)
                console.log(`[update] - ${map}`);

            let promise = autoUpdateFile(map, map_filename, TeraDataAutoUpdateServer + "map_base/" + map, undefined, expectedHash);
            promises.push(updatelimit ? (await promise) : promise);
        }
    }

    // Defs
    for (const def in manifest.protocol) {
        const filepath = path.join(tera_data_folder, 'protocol', def);
        const expectedHash = manifest.protocol[def].toUpperCase();
        if (!fs.existsSync(filepath) || hash(fs.readFileSync(filepath)) !== expectedHash) {
            if (updatelog)
                console.log(`[update] - ${def}`);

            let promise = autoUpdateFile(def, filepath, TeraDataAutoUpdateServer + "protocol/" + def, undefined, expectedHash);
            promises.push(updatelimit ? (await promise) : promise);
        }
    }

    // TODO: delete outdated defs, ...

    return promises;
}

async function autoUpdate(moduleBase, updatelog, updatelimit) {
    console.log(mui.get('update/started'));
    forcedirSync(moduleBase);
    await generateBlacklist();

    let successModules = [];
    let legacyModules = [];
    let failedModules = [];

    let installedModulesChanged;
    do {
        installedModulesChanged = false;
        let addedModules = [];
        const installedModuleInfos = listModuleInfos(moduleBase);

        for (let coreModule in CoreModules) {
            if (!installedModuleInfos.some(mod => mod.name === coreModule.toLowerCase()) && addedModules.indexOf(coreModule) < 0) {
                const coreModuleResult = await autoUpdateFile('module.json', path.join(moduleBase, coreModule, 'module.json'), CoreModules[coreModule]);
                if (!coreModuleResult[1])
                    throw new Error(`Unable to install core module "${coreModule}: ${coreModuleResult[2]}`);
                console.log(mui.get('update/core-module-initialized', { coreModule }));
                installedModulesChanged = true;
                addedModules.push(coreModule);
            }
        }

        for (let moduleInfo of installedModuleInfos) {
            // If the module isn't auto-update compatible, skip it
            if (moduleInfo.compatibility !== 'compatible') {
                legacyModules.push({
                    name: moduleInfo.rawName
                });

                continue;
            }

            let moduleConfigChanged;
            do {
                moduleConfigChanged = false;
                let updateData = JSON.parse(fs.readFileSync(path.join(moduleInfo.path, 'module.json'), 'utf8'));

                for (let dependency in updateData["dependencies"]) {
                    if (!installedModuleInfos.some(mod => mod.name === dependency.toLowerCase()) && addedModules.indexOf(dependency) < 0) {
                        const dependency_result = await autoUpdateFile('module.json', path.join(moduleBase, dependency, 'module.json'), updateData["dependencies"][dependency]);
                        if (!dependency_result[1])
                            throw new Error(`Unable to install dependency module "${dependency}: ${dependency_result[2]}`);
                        console.log(mui.get('update/dependency-module-initialized', { dependency, name: moduleInfo.rawName }));
                        installedModulesChanged = true;
                        addedModules.push(dependency);
                    }
                }

                // Check if auto-update is disabled or if only one file (module.json) exists, then it's a fresh install
                const isFreshInstalled = walkdir(moduleInfo.path, true, false).length === 1;
                if (!isFreshInstalled && moduleInfo.disableAutoUpdate) {
                    console.warn(mui.get('update/warning-module-update-disabled', { name: moduleInfo.rawName }));
                    successModules.push({
                        name: moduleInfo.rawName
                    });

                    continue;
                }

                // Auto-update enabled or fresh install
                try {
                    const moduleConfig = await autoUpdateModule(moduleInfo.rawName, moduleInfo.path, updateData, updatelog, updatelimit);

                    let failedFiles = [];
                    for (let result of moduleConfig["results"]) {
                        if (!result[1]) {
                            failedFiles.push(result[0]);
                            failedFiles.push(result[2]);
                        } else {
                            if (result[0] === "module.json") {
                                moduleConfigChanged = true;
                                if (updatelog)
                                    console.log(mui.get('update/module-config-changed'));
                            }
                        }
                    }

                    if (!moduleConfigChanged) {
                        if (failedFiles.length > 0)
                            throw "Failed to update the following module files:\n - " + failedFiles.join("\n - ");

                        successModules.push({
                            name: moduleInfo.rawName
                        });
                    }
                } catch (e) {
                    console.error(mui.get('update/module-update-failed-1', { name: moduleInfo.rawName }));
                    console.error(e);
                    if (updateData.supportUrl) {
                        console.error(mui.get('update/module-update-failed-2-1', { supportUrl: updateData.supportUrl }));
                        if (updateData.supportUrl !== global.TeraProxy.DiscordUrl)
                            console.error(mui.get('update/module-update-failed-2-2', { supportUrl: global.TeraProxy.SupportUrl }));
                    } else {
                        console.error(mui.get('update/module-update-failed-3', { supportUrl: global.TeraProxy.SupportUrl }));
                    }

                    failedModules.push({
                        name: moduleInfo.rawName
                    });
                }
            } while (moduleConfigChanged);
        }
    } while (installedModulesChanged);

    let updatePromises = await autoUpdateTeraData(updatelog, updatelimit);
    let results = updatelimit ? updatePromises : (await Promise.all(updatePromises));
    let failedFiles = [];
    for (let result of results) {
        if (!result[1])
            failedFiles.push(result[0]);
    }

    if (failedFiles.length > 0) {
        console.error(mui.get('update/tera-data-update-failed', { supportUrl: global.TeraProxy.SupportUrl }));
        failedFiles.forEach(file => console.error(` - ${file}`));
    }

    console.log(mui.get('update/finished'));
    return { "tera-data": (failedFiles.length === 0), "updated": successModules, "legacy": legacyModules, "failed": failedModules };
}

module.exports = autoUpdate;
