const Module = require('./module');
const { isCoreModule } = require('./moduleInstallation');

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

        this.dispatch.on('init', () => this._loadAll('versioncheck'));
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

    _loadAll(loadOn) {
        // Load core modules first
        this.installedModules.forEach(mod => {
            if (this.isCoreModule(mod.name) && !this.isLoaded(mod.name) && mod.options.loadOn === loadOn)
                this.load(mod.name);
        });

        // Then load other modules
        this.installedModules.forEach(mod => {
            if (!this.isCoreModule(mod.name) && !this.isLoaded(mod.name) && mod.options.loadOn === loadOn)
                this.load(mod.name);
        });
    }

    loadAll() {
        if (!this.dispatch)
            return;

        // List installed modules
        const { listModules, loadModuleInfo } = require('./moduleInstallation');

        this.installedModules.clear();
        listModules(this.rootFolder).forEach(name => {
            // Safely load module info
            let moduleInfo;
            try {
                moduleInfo = loadModuleInfo(this.rootFolder, name);
            } catch (e) {
                console.error(`[mods] ERROR: Unable to load module information for "${name}"`);
                console.error(e);
                return;
            }

            if (!moduleInfo.disabled) {
                // Validate module info
                if (this.installedModules.has(moduleInfo.name)) {
                    console.error(`[mods] ERROR: Duplicate module "${name}" detected!`);
                } else {
                    const missingDefs = this.dispatch.checkDefinitions(moduleInfo.packets);
                    if (missingDefs.length > 0) {
                        console.error(`[mods] ERROR: Module "${name}" uses the following outdated/unsupported packets:`);
                        missingDefs.forEach(def => console.error(`[mods] ERROR: - ${def.name}.${def.version}`));
                        console.error(`[mods] ERROR: Please contact the module's author: ${moduleInfo.supportUrl || global.TeraProxy.SupportUrl}`);
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
                        console.error(`[mods] ERROR: Module ${printableName(moduleInfo)} requires "${dependency}" to be installed, but it is not!`);
                        this.installedModules.delete(moduleName);
                        ModulesRemoved = true;
                    }
                });
            });

            this.installedModules.forEach((moduleInfo, moduleName) => {
                moduleInfo.conflicts.forEach(conflict => {
                    if (this.isInstalled(conflict)) {
                        console.error(`[mods] ERROR: Module ${printableName(moduleInfo)} cannot be loaded while "${conflict}" is installed!`);
                        this.installedModules.delete(moduleName);
                        ModulesRemoved = true;
                    }
                });
            });
        } while (ModulesRemoved);

        // Load all modules that are loaded immediately
        this._loadAll('connect');
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
            console.error(`[mods] ERROR: Trying to load module that is not installed: ${name}`);
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
                    console.log(`[mods] Loaded module ${printableName(moduleInfo)}`);
            } catch (e) {
                // Remove any hooks that may have been added by the broken module
                this.dispatch.unhookModule(moduleInfo.name);

                // Clear module files from require cache
                Object.keys(require.cache).forEach(key => {
                    if (key.startsWith(moduleInfo.path))
                        delete require.cache[key];
                });

                console.error(`[mods] ERROR: Module ${printableName(moduleInfo)} could not be loaded!`);
                console.error(`[mods] ERROR: Please contact the module's author: ${moduleInfo.supportUrl || global.TeraProxy.SupportUrl}`);
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
            console.error(`[mods] ERROR: Trying to unload module that is not installed: ${name}`);
            return false;
        }

        let module = this.get(moduleInfo.name);
        if (!module) {
            console.error(`[mods] ERROR: Trying to unload module that is not loaded: ${printableName(moduleInfo)}`);
            return false;
        }

        try {
            this.dispatch.unhookModule(moduleInfo.name);
            module.destructor();
            this.loadedModules.delete(moduleInfo.name);

            // Clear module files from require cache
            Object.keys(require.cache).forEach(key => {
                if (key.startsWith(moduleInfo.path))
                    delete require.cache[key];
            });

            if (logInfo)
                console.log(`[mods] Unloaded module ${printableName(moduleInfo)}`);
            return true;
        } catch (e) {
            console.error(`[mods] ERROR: Module ${printableName(moduleInfo)} could not be unloaded!`);
            console.error(`[mods] ERROR: Please contact the module's author: ${moduleInfo.supportUrl || global.TeraProxy.SupportUrl}`);
            console.error(e);
            return false;
        }
    }

    reload(name, logInfo = true) {
        const moduleInfo = this.getInfo(name);
        if (!moduleInfo) {
            console.error(`[mods] ERROR: Trying to reload module that is not installed: ${name}`);
            return false;
        }
        if (!moduleInfo.options.reloadable) {
            console.error(`[mods] ERROR: Trying to reload module that does not support hot-reload: ${printableName(moduleInfo)}`);
            return false;
        }

        let module = this.get(moduleInfo.name);
        if (!module) {
            console.error(`[mods] ERROR: Trying to reload module that is not loaded: ${printableName(moduleInfo)}`);
            return false;
        }

        const state = module.saveState();
        if (!this.unload(moduleInfo.name, false)) {
            console.error(`[mods] ERROR: Reload failed: ${printableName(moduleInfo)}`);
            return false;
        }

        const newMod = this.load(name, false);
        if (!newMod) {
            console.error(`[mods] ERROR: Reload failed: ${printableName(moduleInfo)}`);
            return false;
        }

        newMod.loadState(state);

        if (logInfo)
            console.log(`[mods] Reloaded module ${printableName(moduleInfo)}`);
        return true;
    }
}

module.exports = ModuleManager;
