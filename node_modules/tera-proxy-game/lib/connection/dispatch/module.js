const fs = require('fs');
const path = require('path');

class Module {
  constructor(manager, moduleInfo) {
    this.manager = manager;
    this.info = moduleInfo;
    this.dispatch = manager.dispatch;
    this.options = moduleInfo.options;
    this.name = moduleInfo.name;
    this.niceName = this.options.niceName || moduleInfo.rawName;
    this.rootFolder = moduleInfo.path;

    // Module settings
    this.settingsVersion = this.options.settingsVersion || null;
    this.settingsFile = (this.settingsVersion === null) ? '' : path.join(this.rootFolder, this.options.settingsFile || 'module_settings.json');
    this.settingsMigrator = (this.settingsVersion === null) ? '' : path.join(this.rootFolder, this.options.settingsMigrator || 'module_settings_migrator.js');
    this.settingsAutosaveOnClose = (this.options.settingsAutosaveOnClose === undefined) ? true : this.options.settingsAutosaveOnClose;

    // Default modules
    this._command = null;
    this._game = null;

    // Initialize require proxy
    this.require = new Proxy(Object.create(null), {
      get: (obj, key) => {
        switch(key) {
            case 'command':
                if(this._command)
                    return this._command;
                return (this._command = this.manager.load(key, false).instance.createInstance(this));
            case 'tera-game-state':
                if(this._game)
                    return this._game;
                return (this._game = this.manager.load(key, false).instance);
            default:
                const mod = this.manager.load(key, false);
                if(!mod)
                  throw new Error(`Required mod not found: ${key}`);
                return mod.instance;
        }
      },
      set() {
        throw new TypeError('Cannot set property of require');
      }
    });

    // Timers
    this._timeouts = new Set();
    this._intervals = new Set();

    // Use tera-game-state callbacks to clear timers when entering/leaving the game
    if (this.name !== 'tera-game-state')
        this.game.on('leave_game', () => { this.clearAllTimeouts(); this.clearAllIntervals(); });

    // Load settings
    this.loadSettings();

    // Implementation will be set later when loaded by manager
    this.instance = null;
  }

  destructor() {
    try {
      if (typeof this.instance.destructor === 'function')
        this.instance.destructor();

      if (this.settingsAutosaveOnClose)
        this.saveSettings();
    } finally {
      this.instance = null;
      this._command = null;
      this._game = null;
    }
  }

  loadState(state) {
    return (typeof this.instance.loadState === 'function') ? this.instance.loadState(state) : null;
  }

  saveState() {
    return (typeof this.instance.saveState === 'function') ? this.instance.saveState() : null;
  }

  hook(...args) {
    const hook = this.dispatch.hook(...args);
    hook.moduleName = this.name;
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
    let hook = dispatch.hook(...args, function() {
      dispatch.unhook(hook);
      return cb.apply(this, arguments);
    });

    hook.moduleName = this.name;
    return hook;
  }

  tryHookOnce(...args) {
    const cb = args.pop();
    if (typeof cb !== 'function')
      throw new Error('last argument not a function');

    try {
      const dispatch = this.dispatch;
      let hook = dispatch.hook(...args, function() {
        dispatch.unhook(hook);
        return cb.apply(this, arguments);
      });

      hook.moduleName = this.name;
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
    if(typeof name !== 'string')
      throw Error('Raw send() is not supported');

    switch(name[0]) {
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

  parseSystemMessage(...args) {
    return this.dispatch.parseSystemMessage(...args);
  }

  buildSystemMessage(...args) {
    return this.dispatch.buildSystemMessage(...args);
  }

  get proxyAuthor() { return this.dispatch.proxyAuthor; }
  get region() { return this.dispatch.region; }
  get majorPatchVersion() { return this.dispatch.majorPatchVersion; }
  get minorPatchVersion() { return this.dispatch.minorPatchVersion; }
  get protocolVersion() { return this.dispatch.protocolVersion; }
  get isConsole() { return this.dispatch.isConsole(); }
  get isClassic() { return this.dispatch.isClassic(); }
  get platform() { return this.dispatch.platform; }
  get connection() { return this.dispatch.connection; }
  get serverId() { return this.dispatch.connection.info.serverId; }

  // Default modules
  get command() { return this.require['command']; }
  get game() { return this.require['tera-game-state']; }

  // Module settings
  loadSettings() {
    if(this.settingsVersion === null)
      return;

    this.settings = {};

    let data = null;
    try {
      data = fs.readFileSync(this.settingsFile);
    } catch (_) {
      this.settings = this.migrateSettings(null, this.settingsVersion);
      return;
    }

    try {
      data = JSON.parse(data);
    } catch (e) {
      if(e.toString().includes('at position 0')) {
          this.error('You closed TERA Toolbox improperly the last time you were using it!');
          this.error(`This caused the settings for module "${this.name}" to become corrupted!`);
          this.error('The module will load default settings now, so adjust them according to your needs.');
          this.error('Please remember to close the program properly: first close the game, then close TERA Toolbox using the X button!');
          this.error('Do not shut down your computer while TERA Toolbox is running!');

          this.settings = this.migrateSettings(null, this.settingsVersion);
          this.saveSettings();
          return;
      } else {
          this.error(`Invalid settings format for module "${this.name}"!`);
          this.error('This means that you broke it when manually editing it.');
          this.error('Please fix the settings file manually or delete it so that default settings can be restored.');
          this.error('------------------------------------------');
          this.error('Advanced error details');
          this.error('The full path to the file is:');
          this.error(`  ${this.settingsFile}`);
          this.error('The full error message is:');
          this.error(`  ${e}`);
          this.error('------------------------------------------');
          throw e;
      }
    }

    if(this.settingsVersion !== data.version) {
      this.settings = this.migrateSettings(data.version, this.settingsVersion, (data.version !== undefined && data.data !== undefined) ? data.data : data);
      return;
    }

    this.settings = data.data;
  }

  saveSettings() {
    if(this.settingsVersion === null)
      return;

    let data = null;
    try {
      data = JSON.stringify({'version': this.settingsVersion, 'data': this.settings}, null, 4);

      try {
        fs.writeFileSync(this.settingsFile, data);
      } catch (e) {
        console.error(`ERROR: Unable to store settings for module ${this.name}! The full error message is:\nERROR: ${e}`);
      }
    } catch (e) {
      console.error(`ERROR: Unable to serialize settings for module ${this.name}! The full error message is:\nERROR: ${e}`);
    }
  }

  migrateSettings(from_ver, to_ver, settings) {
    try {
      let migrator = require(this.settingsMigrator);
      try {
        return migrator(from_ver, to_ver, settings);
      } catch (e) {
        console.error(`ERROR: An error occured while migrating the settings for module ${this.name}!\nERROR: The full error message is:\nERROR: ${e}`);
        throw e;
      }
    } catch (e) {
      console.error(`ERROR: Unable to load settings migrator for module ${this.name}!\nERROR: The full error message is:\nERROR: ${e}`);
      throw e;
    }
  }

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
    if(!this._timeouts.delete(id))
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
    if(!this._intervals.delete(id))
        return false;
    return clearInterval(id);
  }

  clearAllIntervals() {
    this._intervals.forEach(clearInterval);
    this._intervals.clear();
  }

  get activeIntervals() { return this._intervals; }

  // Logging
  log(...args) { console.log(`[${this.name}]`, ...args); }
  warn(...args) { console.warn(`[${this.name}] WARNING:`, ...args); }
  error(...args) { console.error(`[${this.name}] ERROR:`, ...args); }

  // Client Interface
  get clientInterface() { return this.dispatch.connection.info.clientInterface; }
  queryData(...args) { return this.clientInterface.queryData(...args); }
}

module.exports = Module;
