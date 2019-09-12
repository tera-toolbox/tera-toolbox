const mui = require('tera-toolbox-mui').DefaultInstance;
const Module = require('./module');
const { isCoreModule, listModules, loadModuleInfo } = require('tera-mod-management');

function printableName(moduleInfo) {
    if (moduleInfo.options.niceName && moduleInfo.options.niceName !== moduleInfo.name)
        return `"${moduleInfo.options.niceName}" (${moduleInfo.rawName})`;
    return `"${moduleInfo.rawName}"`;
}

// Runtime module manager
class ModuleManager {
    constructor(dispatch, rootFolder) {
        this.dispatch = dispatch;
        this.rootFolder = rootFolder;
        this.installedModules = new Map();
        this.loadedModules = new Map();
    }

    destructor() {
        this.unloadAll();
        this.dispatch = null;
    }

    isInstalled(name) {
        return this.installedModules.has(name.toLowerCase());
    }

    getInfo(name) {
        return this.installedModules.get(name.toLowerCase());
    }

    isLoaded(name) {
        return this.loadedModules.has(name.toLowerCase());
    }

    get(name) {
        return this.loadedModules.get(name.toLowerCase());
    }

    isCoreModule(name) {
        const info = this.getInfo(name.toLowerCase());
        return info && isCoreModule(info);
    }

    loadAll() {
        if (!this.dispatch || !this.dispatch.protocolMap)
            return;

        // List installed modules
        this.installedModules.clear();
        listModules(this.rootFolder).forEach(name => {
            // Safely load module info
            let moduleInfo;
            try {
                moduleInfo = loadModuleInfo(this.rootFolder, name);
            } catch (e) {
                console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/load-module-info-error', { name }));
                console.error(e);
                return;
            }

            if (!moduleInfo.disabled) {
                // Validate module info
                if (this.installedModules.has(moduleInfo.name)) {
                    console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/duplicate-mod-error', { name }));
                } else {
                    // TODO: reenable and implement a better format that allows for versioned defs
                    const missingDefs = []; //this.dispatch.checkDefinitions(moduleInfo.packets);
                    if (missingDefs.length > 0) {
                        console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-1', { name }));
                        missingDefs.forEach(def => console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-2', { name: def.name, version: def.version })));
                        console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/unsupported-def-error-3', { supportUrl: moduleInfo.supportUrl || global.TeraProxy.SupportUrl }));
                    } else {
                        this.installedModules.set(moduleInfo.name, moduleInfo);
                    }
                }
            }
        });

        // Check dependencies and conflicts
        let ModulesRemoved;
        do {
            ModulesRemoved = false;

            this.installedModules.forEach((moduleInfo, moduleName) => {
                moduleInfo.dependencies.forEach(dependency => {
                    if (!this.isInstalled(dependency)) {
                        console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/missing-mod-dependency-error', { name: printableName(moduleInfo), dependency }));
                        this.installedModules.delete(moduleName);
                        ModulesRemoved = true;
                    }
                });
            });

            this.installedModules.forEach((moduleInfo, moduleName) => {
                moduleInfo.conflicts.forEach(conflict => {
                    if (this.isInstalled(conflict)) {
                        console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-conflict-error', { name: printableName(moduleInfo), conflict }));
                        this.installedModules.delete(moduleName);
                        ModulesRemoved = true;
                    }
                });
            });
        } while (ModulesRemoved);

        // Now, after checking conflicts/dependencies, filter out non-network mods
        for (let k of this.installedModules.keys()) {
            if (this.installedModules.get(k).category !== 'network')
                this.installedModules.delete(k);
        }
        
        // Load core modules first
        this.installedModules.forEach(mod => {
            if (this.isCoreModule(mod.name) && !this.isLoaded(mod.name))
                this.load(mod.name);
        });

        // Then load other modules
        this.installedModules.forEach(mod => {
            if (!this.isCoreModule(mod.name) && !this.isLoaded(mod.name))
                this.load(mod.name);
        });
    }

    unloadAll() {
        this.loadedModules.forEach(mod => this.unload(mod.name));
    }

    load(name, logInfo = true) {
        if (!this.dispatch)
            return;

        let module = this.get(name);
        if (module)
            return module;

        const moduleInfo = this.getInfo(name);
        if (!moduleInfo) {
            if (logInfo)
                console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-load-mod-not-installed', { name }));
        } else {
            try {
                module = new Module(this, moduleInfo);

                const BigIntJsonBefore = BigInt.prototype.toJSON;

                const moduleConstructor = require(moduleInfo.path);

                if (BigIntJsonBefore !== BigInt.prototype.toJSON) {
                    BigInt.prototype.toJSON = BigIntJsonBefore;
                    if (global.TeraProxy.DevMode)
                        console.log('[dev] You must not override BigInt.prototype.toJSON');
                    throw new Error("Forbidden module behavior.");
                }

                module.instance = new moduleConstructor(module);

                if (BigIntJsonBefore !== BigInt.prototype.toJSON) {
                    BigInt.prototype.toJSON = BigIntJsonBefore;
                    if (global.TeraProxy.DevMode)
                        console.log('[dev] You must not override BigInt.prototype.toJSON');
                    throw new Error("Forbidden module behavior.");
                }

                this.loadedModules.set(moduleInfo.name, module);

                if (logInfo)
                    console.log(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-loaded', { name: printableName(moduleInfo) }));
            } catch (e) {
                // Remove any hooks that may have been added by the broken module
                this.dispatch.unhookModule(moduleInfo.name);

                // Clear module files from require cache
                Object.keys(require.cache).forEach(key => {
                    if (key.startsWith(moduleInfo.path) && !key.endsWith('.node'))
                        delete require.cache[key];
                });

                console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-load-error-1', { name: printableName(moduleInfo) }));
                console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-load-error-2', { supportUrl: moduleInfo.supportUrl || global.TeraProxy.SupportUrl }));
                console.error(e);
            }
        }

        return module;
    }

    unload(name, logInfo = true) {
        if (!this.dispatch)
            return;

        const moduleInfo = this.getInfo(name);
        if (!moduleInfo) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-unload-mod-not-installed', { name }));
            return false;
        }

        let module = this.get(moduleInfo.name);
        if (!module) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-unload-mod-not-loaded', { name: printableName(moduleInfo) }));
            return false;
        }

        let result;
        try {
            this.dispatch.unhookModule(moduleInfo.name);
            module.destructor();
            result = true;
        } catch (e) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-unload-error-1', { name: printableName(moduleInfo) }));
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-unload-error-2', { supportUrl: moduleInfo.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            result = false;
        }

        this.loadedModules.delete(moduleInfo.name);

        // Clear module files from require cache
        Object.keys(require.cache).forEach(key => {
            if (key.startsWith(moduleInfo.path) && !key.endsWith('.node'))
                delete require.cache[key];
        });

        if (result && logInfo)
            console.log(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-unloaded', { name: printableName(moduleInfo) }));
        return result;
    }

    reload(name, logInfo = true) {
        const moduleInfo = this.getInfo(name);
        if (!moduleInfo) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-installed', { name }));
            return false;
        }
        if (!moduleInfo.options.reloadable) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-supported', { name: printableName(moduleInfo) }));
            return false;
        }

        let module = this.get(moduleInfo.name);
        if (!module) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-not-loaded', { name: printableName(moduleInfo) }));
            return false;
        }

        const state = module.saveState();
        if (!this.unload(moduleInfo.name, false)) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-unload-failed', { name: printableName(moduleInfo) }));
            return false;
        }

        const newMod = this.load(name, false);
        if (!newMod) {
            console.error(mui.get('tera-network-proxy/connection/dispatch/modulemanager/cannot-reload-mod-load-failed', { name: printableName(moduleInfo) }));
            return false;
        }

        newMod.loadState(state);

        if (logInfo)
            console.log(mui.get('tera-network-proxy/connection/dispatch/modulemanager/mod-reloaded', { name: printableName(moduleInfo) }));
        return true;
    }
}

module.exports = ModuleManager;
