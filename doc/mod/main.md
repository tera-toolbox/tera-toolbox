# Proxy Modules
In the following, you will find an introduction to module development and documentation (+ examples) of proxy features. It is assumed that you have a basic understanding of Node.JS/Electron, how the game's network communication works, and programming in general.

## Terminology
Let's start by introducing important terminology:
- The `mods folder` is the folder that contains all mods loaded by proxy. Typically `[proxy folder]/mods/`.
- Modules are either `regular` (that is all module files reside within a subfolder in the mods folder, e.g. `MyModule/index.js`) or `standalone` (that is consist only of a single file, e.g. `MyModule.js`, in the mods folder). Pretty much any mod except for private debugging tools is regular. Mods must be regular in order to be able to use a lot of proxy functionality, such as auto-updating.
- Modules are either `compatible`, meaning that they are compatible with the modern proxy and able to utilize all of its functionality, or `legacy`. Standalone modules are always legacy. Mods must obviously be compatible in order to be able to make use of advanced proxy functionality such as auto-updating.
- The `module folder` (in the context of this documentation) refers to the subfolder of a regular and compatible module within proxy's mods folder.

Legacy and standalone modules will not be talked about for the rest of this documentation. Most of the stuff you will find in here only applies to regular and compatible modules.

## Module Files
A module typically consists of two parts - the actual code, and the surrounding metadata (auto-update information and so on). These are spread across multiple files, all located within the module's subfolder in the mods folder.
### Metadata
The most important metadata files are:
- `module.json`: Contains important information about your module, such as name, author, description, where to download updates from, and so on. This is the _only_ file required to install a new module - make a new folder, drag a `module.json` file into it, start proxy, and it'll download and install everything.
- `manifest.json`: This is the update manifest (hence the name) downloaded by proxy when auto-updating or installing the mod from the servers specified in `module.json`. It contains hashes to verify the integrity (and check for updates) of all of the module's files, and other info such as a list of packet definitions required by the module in order to work properly.

You can find a more thorough explanation and examples of metadata files [here](metadata.md).
### Code
When loading a module, proxy essentially just calls Node.JS's `require` function like this: `require([mods folder]/[module folder name]/)`. This means that by default, it'll load `index.js` in the module folder and expect it to contain the startup code of the module. You can modify that behavior by placing a `package.json` file in the root of your module folder, just as you would do for any `node_module` import in a regular Node.JS application development context.

Whatever file is required by proxy as the root of the module (called `root file` in the following) is expected to export exactly one object. It must be either a class (`constructor()` will be called when the module is loaded and optionally `destructor()` will be called when the module is unloaded) or a function (which will be called when the module is loaded). The module load function will be passed a single argument, which is the interface to be used by the module for any interaction with proxy. It is typically called `mod`.

Example (`MyModule/index.js`):
```js
function MyModule(mod) {
    // This will be called when your module is loaded by proxy.
    
    // Note that you can (if you insist!) also abuse JS weirdness to have a "destructor" even when using functions:
    this.destructor = () => {
        // This will be called when your module is unloaded by proxy (optional).
    }
}

module.exports = MyModule;
```

Example (`MyModule/index.js`):
```js
class MyModule
{
    constructor(mod) {
        // This will be called when your module is loaded by proxy.
    }
    
    destructor() {
        // This will be called when your module is unloaded by proxy (optional).
    }
}

module.exports = MyModule;
```

Within the module's constructor, the module needs to be set up, for example registering hooks for network traffic, adding chat commands, initializing GUI windows, and so on. You're welcome to continue reading more about
- [managing network traffic hooks](hooks.md)
- [registering chat commands](command.md)
- [using tera-game-state](tera-game-state.md)
- [using the logging API](logging.md)
- [using the module settings API](settings.md)
- [using the module timer API](timers.md)
- [using the game client interface API / DataCenter queries](client-interface.md)
- [showing graphical user interfaces](gui.md)
- [other features](other.md)

## Exemplary Modules
- TODO
