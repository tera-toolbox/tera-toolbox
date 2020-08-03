const mui = require('tera-toolbox-mui').DefaultInstance;
const path = require('path');
const fs = require('fs');
const ModLegacyWrapper = require('./mod-legacy-wrapper');

class ModInterfaceBase {
    constructor(parent) {
        this.parent = parent;

        // Implementation will be set later when loaded by manager
        this.instance = null;

        // Timers
        this._timeouts = new Set();
        this._intervals = new Set();
    }

    destructor() {
        try {
            if (this.instance && typeof this.instance.destructor === 'function')
                this.instance.destructor();
        } finally {
            this.instance = null;
        }

        this.clearAllTimeouts();
        this.clearAllIntervals();
    }

    // Data accessors
    get manager() { return this.parent.manager; }
    get info() { return this.parent.info; }
    get settings() { return this.parent.settings; }
    set settings(val) { return this.parent.settings = val; }

    // Timers
    setTimeout(callback, delay, ...args) {
        const id = setTimeout(() => {
            callback(...args);
            this._timeouts.delete(id);
        }, delay);

        this._timeouts.add(id);
        return id;
    }

    clearTimeout(id) {
        if (!this._timeouts.delete(id))
            return false;
        return clearTimeout(id);
    }

    clearAllTimeouts() {
        this._timeouts.forEach(clearTimeout);
        this._timeouts.clear();
    }

    get activeTimeouts() { return this._timeouts; }


    setInterval(callback, delay, ...args) {
        const id = setInterval(callback, delay, ...args);
        this._intervals.add(id);
        return id;
    }

    clearInterval(id) {
        if (!this._intervals.delete(id))
            return false;
        return clearInterval(id);
    }

    clearAllIntervals() {
        this._intervals.forEach(clearInterval);
        this._intervals.clear();
    }

    get activeIntervals() { return this._intervals; }

    // Logging
    log(...args) { console.log(mui.get('mod/prefix-log', { name: this.info.name }), ...args); }
    warn(...args) { console.warn(`warn:${mui.get('mod/prefix-warn', { name: this.info.name })}`, ...args); }
    error(...args) { console.error(mui.get('mod/prefix-error', { name: this.info.name }), ...args); }

    // Module settings
    loadSettings() { this.parent.loadSettings(); }
    saveSettings() { this.parent.saveSettings(); }
}

class GlobalModInterface extends ModInterfaceBase {
    constructor(parent) {
        super(parent);

        // Initialize require proxy
        this.require = new Proxy(Object.create(null), {
            get: (obj, key) => {
                let mod = this.manager.load(key, false);
                if (!mod)
                    throw new Error(`Required mod not found: ${key}`);

                let globalMod = mod.loadGlobalInstance(false);
                return mod.requireInterface(globalMod ? globalMod.instance : null, null, null, this);
            },
            set() {
                throw new TypeError('Cannot set property of require');
            }
        });
    }

    // Hot reloading
    loadState(state) {
        return (typeof this.instance.loadState === 'function') ? this.instance.loadState(state) : null;
    }

    saveState() {
        return (typeof this.instance.saveState === 'function') ? this.instance.saveState() : null;
    }
}

class ClientModInterface extends ModInterfaceBase {
    constructor(parent, clientInterface) {
        super(parent);

        this.clientInterface = clientInterface;

        // Initialize require proxy
        this.require = new Proxy(Object.create(null), {
            get: (obj, key) => {
                let mod = this.manager.load(key, false);
                if (!mod)
                    throw new Error(`Required mod not found: ${key}`);

                let globalMod = mod.loadGlobalInstance(false);
                let clientMod = mod.loadClientInstance(this.clientInterface, false);
                let networkMod = mod.getNetworkInstanceByClientInterface(this.clientInterface);
                return mod.requireInterface(globalMod ? globalMod.instance : null, clientMod ? clientMod.instance : null, networkMod ? networkMod.instance : null, this);
            },
            set() {
                throw new TypeError('Cannot set property of require');
            }
        });
    }

    // Hot reloading
    loadState(state) {
        return (typeof this.instance.loadState === 'function') ? this.instance.loadState(state) : null;
    }

    saveState() {
        return (typeof this.instance.saveState === 'function') ? this.instance.saveState() : null;
    }

    // Data accessors
    get publisher() { return this.clientInterface.info.publisher; }
    get platform() { return this.clientInterface.info.platform; }
    get environment() { return this.clientInterface.info.environment; }
    get language() { return this.clientInterface.info.language; }
    get majorPatchVersion() { return this.clientInterface.info.majorPatchVersion; }
    get minorPatchVersion() { return this.clientInterface.info.minorPatchVersion; }

    // Global & network mod instances
    get globalMod() { return this.parent.getGlobalInstance().instance; }
    get networkMod() { return this.parent.getNetworkInstanceByClientInterface(this.clientInterface); }

    // Client interface
    queryData(...args) { return this.clientInterface.queryData(...args); }

    // File-based client mods
    async _install() {
        if (!this.instance.install || typeof this.instance.install !== 'function')
            return;

        let installer = {
            gpk: (fromPath, filename = null) => this.clientInterface.installGPK(path.join(this.info.path, fromPath), filename),
            dll: filename => this.clientInterface.injectDLL(path.join(this.info.path, filename)),
        };

        try {
            await this.instance.install(installer);
        } catch (e) {
            this.error(mui.get('mod/client-install-error-1', { name: this.printableName }));
            this.error(mui.get('mod/client-install-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            this.error(e);
        }
    }
}

class NetworkModInterface extends ModInterfaceBase {
    constructor(parent, dispatch) {
        super(parent);

        this.dispatch = dispatch;

        // Core mod instances
        this._command = null;
        this._game = null;

        // Initialize require proxy
        this.require = new Proxy(Object.create(null), {
            get: (obj, key) => {
                let mod = this.manager.load(key, false);
                if (!mod)
                    throw new Error(`Required mod not found: ${key}`);

                let globalMod = mod.loadGlobalInstance(false);
                let clientMod = mod.loadClientInstance(this.clientInterface, false);
                let networkMod = mod.loadNetworkInstance(this.dispatch, false);
                return mod.requireInterface(globalMod ? globalMod.instance : null, clientMod ? clientMod.instance : null, networkMod ? networkMod.instance : null, this);
            },
            set() {
                throw new TypeError('Cannot set property of require');
            }
        });

        // Use tera-game-state callbacks to clear timers when entering/leaving the game
        if (this.info.name !== 'tera-game-state') {
            try {
                this.game.on('leave_game', () => { this.clearAllTimeouts(); this.clearAllIntervals(); });
            } catch (_) {
                this.warn(mui.get('mod/tera-game-state-not-loaded'));
            }
        }
    }

    destructor() {
        super.destructor();
        this.dispatch.unhookModule(this.info.name);

        // Destroy core mod instances
        try {
            if (this._command && typeof this._command.destructor === 'function')
                this._command.destructor();
        } finally {
            this._command = null;
            this._game = null;
        }
    }

    // Hot reloading
    loadState(state) {
        return (typeof this.instance.loadState === 'function') ? this.instance.loadState(state) : null;
    }

    saveState() {
        return (typeof this.instance.saveState === 'function') ? this.instance.saveState() : null;
    }

    // Data accessors
    get publisher() { return this.dispatch.connection.metadata.publisher; }
    get platform() { return this.dispatch.connection.metadata.platform; }
    get environment() { return this.dispatch.connection.metadata.environment; }
    get language() { return this.dispatch.connection.metadata.language; }
    get majorPatchVersion() { return this.dispatch.connection.metadata.majorPatchVersion; }
    get minorPatchVersion() { return this.dispatch.connection.metadata.minorPatchVersion; }
    get connection() { return this.dispatch.connection; }
    get serverId() { return this.dispatch.connection.metadata.serverId; }
    get serverList() { return this.dispatch.connection.metadata.serverList; }

    // Core mod instances
    get command() {
        if (this._command)
            return this._command;

        return this._command = this.require['command'].createInstance(this);
    }

    get game() {
        if (this._game)
            return this._game;

        return this._game = this.require['tera-game-state'];
    }

    // Global & client mod instances
    get globalMod() { return this.parent.getGlobalInstance().instance; }
    get clientMod() { return this.parent.getClientInstance(this.dispatch.connection.clientInterfaceConnection).instance; }

    // Network traffic interface
    hook(...args) {
        const hook = this.dispatch.hook(this.info.name, ...args);
        return hook;
    }

    tryHook(...args) {
        try {
            return this.hook(...args);
        } catch (_) {
            return null;
        }
    }

    hookOnce(...args) {
        const cb = args.pop();
        if (typeof cb !== 'function')
            throw new Error('last argument not a function');

        const dispatch = this.dispatch;
        let hook = dispatch.hook(this.info.name, ...args, function () {
            dispatch.unhook(hook);
            return cb.apply(this, arguments);
        });

        return hook;
    }

    tryHookOnce(...args) {
        const cb = args.pop();
        if (typeof cb !== 'function')
            throw new Error('last argument not a function');

        try {
            const dispatch = this.dispatch;
            let hook = dispatch.hook(this.info.name, ...args, function () {
                dispatch.unhook(hook);
                return cb.apply(this, arguments);
            });

            return hook;
        } catch (_) {
            return null;
        }
    }

    unhook(...args) {
        return this.dispatch.unhook(...args);
    }

    toClient(...args) {
        return this.dispatch.write(false, ...args);
    }

    toServer(...args) {
        return this.dispatch.write(true, ...args);
    }

    send(name, version, data) {
        if (typeof name !== 'string')
            throw Error('Raw send() is not supported');

        switch (name[name.indexOf('TTB_') === 0 ? 4 : 0]) {
            case 'S':
            case 'I':
                return this.dispatch.write(false, name, version, data);
            case 'C':
                return this.dispatch.write(true, name, version, data);
            default:
                throw new Error(`Unknown packet direction: ${name}`);
        }
    }

    trySend(...args) {
        try {
            return this.send(...args);
        } catch (_) {
            return false;
        }
    }

    // System messages
    parseSystemMessage(...args) {
        return this.dispatch.parseSystemMessage(...args);
    }

    buildSystemMessage(...args) {
        return this.dispatch.buildSystemMessage(...args);
    }

    // Client Interface
    get clientInterface() { return this.dispatch.connection.clientInterfaceConnection; }
    queryData(...args) { return this.clientInterface.queryData(...args); }
}

class Mod {
    constructor(manager, info) {
        this.manager = manager;
        this.info = info;
        this.implementation = null;

        this.requireInterface = null;
        this.globalInstance = null;
        this.clientInstances = new Map;
        this.networkInstances = new Map;
        this.networkInstancesByClientInterface = new Map;

        // Module settings
        this.settingsVersion = this.info.options.settingsVersion || null;
        this.settingsFile = (this.settingsVersion === null) ? '' : path.join(this.info.path, this.info.options.settingsFile || 'module_settings.json');
        this.settingsMigrator = (this.settingsVersion === null) ? '' : path.join(this.info.path, this.info.options.settingsMigrator || 'module_settings_migrator.js');
        this.settingsAutosaveOnClose = (this.info.options.settingsAutosaveOnClose === undefined) ? true : this.info.options.settingsAutosaveOnClose;
        this.loadSettings();
    }

    destructor(logInfo = true) {
        this.unload(logInfo);
    }

    unload(logInfo = true) {
        this.networkInstances.forEach((mod, dispatch) => this.unloadNetworkInstance(dispatch, logInfo));
        this.networkInstancesByClientInterface.clear();
        this.clientInstances.forEach((mod, clientInterface) => this.unloadClientInstance(clientInterface, logInfo));
        this.unloadGlobalInstance(logInfo);
        this.requireInterface = null;
        this.unloadCache();

        if (this.settingsAutosaveOnClose)
            this.saveSettings();

        if (logInfo)
            console.log(mui.get('mod/mod-unloaded', { name: this.printableName }));
    }

    reload(logInfo = true) {
        // Save state
        const globalState = this.globalInstance ? this.globalInstance.saveState() : null;
        const clientStates = [];
        this.clientInstances.forEach((instance, clientInterface) => clientStates.push([clientInterface, instance.saveState()]));
        const networkStates = [];
        this.networkInstances.forEach((instance, dispatch) => networkStates.push([dispatch, instance.saveState()]));

        // Reload
        this.unload(false);
        this.loadCache(false);
        this.loadGlobalInstance(false);
        clientStates.forEach(state => this.loadClientInstance(state[0], false));
        networkStates.forEach(state => this.loadNetworkInstance(state[0], false));

        // Restore state
        networkStates.forEach(state => this.getNetworkInstance(state[0]).loadState(state[1]));
        clientStates.forEach(state => this.getClientInstance(state[0]).loadState(state[1]));
        if (this.getGlobalInstance())
            this.getGlobalInstance().loadState(globalState);

        if (logInfo)
            console.log(mui.get('mod/mod-reloaded', { name: this.printableName }));
        return true;
    }

    loadCache(logInfo = true) {
        try {
            this.implementation = require(this.info.path);

            if (!this.implementation.GlobalMod && !this.implementation.ClientMod && !this.implementation.NetworkMod)
                this.implementation = ModLegacyWrapper(this.info, this.implementation);

            if (this.implementation.RequireInterface)
                this.requireInterface = this.implementation.RequireInterface;
            else
                this.requireInterface = (globalMod, clientMod, networkMod, requiredBy) => ({ globalMod, clientMod, networkMod });

            if (logInfo)
                console.log(mui.get('mod/mod-preloaded', { name: this.printableName }));
            return true;
        } catch (e) {
            this.unloadCache(logInfo);

            console.error(mui.get('mod/mod-preload-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-preload-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            return false;
        }
    }

    unloadCache(logInfo = true) {
        this.implementation = null;

        Object.keys(require.cache).forEach(key => {
            if (key.startsWith(this.info.path) && !key.endsWith('.node'))
                delete require.cache[key];
        });
    }
    
    get printableName() {
        if (this.info.options.cliName && this.info.options.cliName !== this.info.name)
            return `"${this.info.options.cliName}" (${this.info.rawName})`;
        return `"${this.info.rawName}"`;
    }

    loadGlobalInstance(logInfo = true) {
        let module = this.getGlobalInstance();
        if (module)
            return module;

        if (!this.implementation || !this.implementation.GlobalMod)
            return null;

        module = new GlobalModInterface(this);

        try {
            module.instance = new this.implementation.GlobalMod(module);
        } catch (e) {
            console.error(mui.get('mod/mod-global-instance-load-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-global-instance-load-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            return null;
        }

        this.globalInstance = module;

        if (logInfo)
            console.log(mui.get('mod/mod-global-instance-loaded', { name: this.printableName }));
        return module;
    }

    unloadGlobalInstance(logInfo = true) {
        let module = this.getGlobalInstance();
        if (!module)
            return false;

        let result;
        try {
            module.destructor();
            result = true;
        } catch (e) {
            console.error(mui.get('mod/mod-global-instance-unload-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-global-instance-unload-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            result = false;
        }

        this.globalInstance = null;

        if (result && logInfo)
            console.log(mui.get('mod/mod-global-instance-unloaded', { name: this.printableName }));
        return result;
    }

    getGlobalInstance() {
        return this.globalInstance;
    }

    loadClientInstance(clientInterface, logInfo = true) {
        let module = this.getClientInstance(clientInterface);
        if (module)
            return module;

        if (!this.implementation || !this.implementation.ClientMod)
            return null;

        module = new ClientModInterface(this, clientInterface);

        try {
            module.instance = new this.implementation.ClientMod(module);
        } catch (e) {
            console.error(mui.get('mod/mod-client-instance-load-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-client-instance-load-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            return null;
        }

        this.clientInstances.set(clientInterface, module);

        if (logInfo)
            console.log(mui.get('mod/mod-client-instance-loaded', { name: this.printableName }));
        return module;
    }

    unloadClientInstance(clientInterface, logInfo = true) {
        let module = this.clientInstances.get(clientInterface);
        if (!module)
            return false;

        let result;
        try {
            module.destructor();
            result = true;
        } catch (e) {
            console.error(mui.get('mod/mod-client-instance-unload-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-client-instance-unload-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            result = false;
        }

        this.clientInstances.delete(clientInterface);

        if (result && logInfo)
            console.log(mui.get('mod/mod-client-instance-unloaded', { name: this.printableName }));
        return result;
    }

    getClientInstance(clientInterface) {
        return this.clientInstances.get(clientInterface);
    }

    loadNetworkInstance(dispatch, logInfo = true) {
        let module = this.getNetworkInstance(dispatch);
        if (module)
            return module;

        if (!this.implementation || !this.implementation.NetworkMod)
            return null;

        module = new NetworkModInterface(this, dispatch);

        try {
            module.instance = new this.implementation.NetworkMod(module);
        } catch (e) {
            module.destructor();

            console.error(mui.get('mod/mod-network-instance-load-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-network-instance-load-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            return null;
        }

        this.networkInstances.set(dispatch, module);
        this.networkInstancesByClientInterface.set(module.clientInterface, module);

        if (logInfo)
            console.log(mui.get('mod/mod-network-instance-loaded', { name: this.printableName }));
        return module;
    }

    unloadNetworkInstance(dispatch, logInfo = true) {
        let module = this.networkInstances.get(dispatch);
        if (!module)
            return false;
        let clientInterface = module.clientInterface;

        let result;
        try {
            module.destructor();
            result = true;
        } catch (e) {
            console.error(mui.get('mod/mod-network-instance-unload-error-1', { name: this.printableName }));
            console.error(mui.get('mod/mod-network-instance-unload-error-2', { supportUrl: this.info.supportUrl || global.TeraProxy.SupportUrl }));
            console.error(e);
            result = false;
        }

        this.networkInstances.delete(dispatch);
        this.networkInstancesByClientInterface.delete(clientInterface);

        if (result && logInfo)
            console.log(mui.get('mod/mod-network-instance-unloaded', { name: this.printableName }));
        return result;
    }

    getNetworkInstance(dispatch) {
        return this.networkInstances.get(dispatch);
    }

    getNetworkInstanceByClientInterface(clientInterface) {
        return this.networkInstancesByClientInterface.get(clientInterface);
    }

    // Module settings
    loadSettings() {
        if (this.settingsVersion === null)
            return;

        let migrateSettings = (from_ver, to_ver, settings) => {
            try {
                let migrator = require(this.settingsMigrator);
                try {
                    return migrator(from_ver, to_ver, settings);
                } catch (e) {
                    console.error(mui.get('mod/settings-migrate-error-run-migrator'));
                    console.error(e);
                    throw e;
                }
            } catch (e) {
                console.error(mui.get('mod/settings-migrate-error-load-migrator'));
                console.error(e);
                throw e;
            }
        };

        this.settings = {};

        let data = null;
        try {
            data = fs.readFileSync(this.settingsFile);
        } catch (_) {
            this.settings = migrateSettings(null, this.settingsVersion);
            return;
        }

        try {
            data = JSON.parse(data);
        } catch (e) {
            if (e.toString().includes('at position 0')) {
                console.error(mui.get('mod/settings-load-error-corrupted-1'));
                console.error(mui.get('mod/settings-load-error-corrupted-2', { name: this.info.name }));
                console.error(mui.get('mod/settings-load-error-corrupted-3'));
                console.error(mui.get('mod/settings-load-error-corrupted-4'));
                console.error(mui.get('mod/settings-load-error-corrupted-5'));

                this.settings = migrateSettings(null, this.settingsVersion);
                this.saveSettings();
                return;
            } else {
                console.error(mui.get('mod/settings-load-error-invalid-format-1', { name: this.info.name }));
                console.error(mui.get('mod/settings-load-error-invalid-format-2'));
                console.error(mui.get('mod/settings-load-error-invalid-format-3'));
                console.error(mui.get('mod/settings-load-error-invalid-format-4'));
                console.error(mui.get('mod/settings-load-error-invalid-format-5'));
                console.error(mui.get('mod/settings-load-error-invalid-format-6'));
                console.error(mui.get('mod/settings-load-error-invalid-format-7', { settingsFile: this.settingsFile }));
                console.error(mui.get('mod/settings-load-error-invalid-format-8'));
                console.error(mui.get('mod/settings-load-error-invalid-format-9', { e }));
                console.error(mui.get('mod/settings-load-error-invalid-format-10'));
                throw e;
            }
        }

        this.settings = (this.settingsVersion === data.version) ? data.data : migrateSettings(data.version, this.settingsVersion, (data.version !== undefined && data.data !== undefined) ? data.data : data);
    }

    saveSettings() {
        if (this.settingsVersion === null)
            return;

        let data = null;
        try {
            data = JSON.stringify({ 'version': this.settingsVersion, 'data': this.settings }, null, 4);

            try {
                fs.writeFileSync(this.settingsFile, data);
            } catch (e) {
                console.error(mui.get('mod/settings-save-error-write'));
                console.error(e);
            }
        } catch (e) {
            console.error(mui.get('mod/settings-save-error-stringify'));
            console.error(e);
        }
    }
}

module.exports = Mod;
