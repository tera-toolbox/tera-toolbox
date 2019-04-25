# TERA Toolbox Modules
In the following, you will find an introduction to module development and a documentation (+ examples) of features offered by TERA Toolbox to developers. It is assumed that you have a basic understanding of Node.JS/Electron, how the game's network communication works, and programming in general.

## Terminology
Let's start by introducing important terminology:
- The `mods folder` is the folder that contains all mods loaded by TERA Toolbox. Typically `[toolbox root folder]/mods/`.
- There are two types of mods: `network` mods (hijacking the game's network traffic; this functionality is based on Tera-Proxy) and `client` mods (altering the game's files, i.e. GPK mods).
- Modules are either `regular` (that is all module files reside within a subfolder in the mods folder, e.g. `MyModule/index.js`) or `standalone` (that is consist only of a single file, e.g. `MyModule.js`, in the mods folder). Pretty much any mod except for private debugging tools is regular. Mods must be regular in order to be able to leverage the full potential of TERA Toolbox - standalone mods can only access a severely limited feature set (and can only be network mods, as explained above).
- Modules are either `compatible`, meaning that they are fully compatible with TERA Toolbox and able to utilize all offered functionality, or `legacy`. Standalone modules are always legacy.
- The `module folder` (in the context of this documentation) refers to the subfolder of a regular and compatible module within the mods folder.

Legacy and standalone modules will not be talked about for the rest of this documentation. Most of the stuff you will find in here only applies to regular and compatible modules.

## Module Files
A module typically consists of two parts - the actual code, and the surrounding metadata (auto-update information and so on). These are spread across multiple files, all located within the module's subfolder in the mods folder.
### Metadata
The most important metadata files are:
- `module.json`: Contains important information about your module, such as name, author, description, where to download updates from, and so on. This is the _only_ file required to install a new module - make a new folder, drag a `module.json` file into it, start TERA Toolbox, and it'll download and install everything.
- `manifest.json`: This is the update manifest (hence the name) downloaded by TERA Toolbox when auto-updating or installing the mod from the servers specified in `module.json`. It contains hashes to verify the integrity (and check for updates) of all of the module's files, and other info such as a list of packet definitions required by the module in order to work properly.

You can find a more thorough explanation and examples of metadata files [here](metadata.md).
### Code
When loading a module, TERA Toolbox essentially just calls Node.JS's `require` function like this: `require([mods folder]/[module folder name]/)`. This means that by default, it'll load `index.js` in the module folder and expect it to contain the startup code of the module. You can modify that behavior by placing a `package.json` file in the root of your module folder, just as you would do for any `node_modules` import in a regular Node.JS application development context.

Whatever file is required by TERA Toolbox as the root of the module (called `root file` in the following) is expected to export exactly one object. It must be either a class (`constructor()` will be called when the module is loaded and optionally `destructor()` will be called when the module is unloaded) or a function (which will be called when the module is loaded). The module load function will be passed a single argument, which is the interface to be used by the module for any interaction with the framework. It is typically called `mod`.

Example (`MyModule/index.js`):
```js
function MyModule(mod) {
    // This will be called when your module is loaded by TERA Toolbox.
    
    // Note that you can (if you insist!) also abuse JS weirdness to have a "destructor" even when using functions:
    this.destructor = () => {
        // This will be called when your module is unloaded by TERA Toolbox (optional).
    }
}

module.exports = MyModule;
```

Example (`MyModule/index.js`):
```js
class MyModule
{
    constructor(mod) {
        // This will be called when your module is loaded by TERA Toolbox.
    }
    
    destructor() {
        // This will be called when your module is unloaded by TERA Toolbox (optional).
    }
}

module.exports = MyModule;
```

Within the module's constructor, the module needs to be set up. Network mods typically register hooks for network traffic, add chat commands, etc. here, whereas client mods usually specify which modded GPK files to install.

You're welcome to continue reading more about
- [(Network Mods) managing network traffic hooks](hooks.md)
- [(Network Mods) registering chat commands](command.md)
- [(Network Mods) using tera-game-state](tera-game-state.md)
- [(Network Mods) using the module timer API](timers.md)
- [(Client Mods) modifying the game client's files](client-mods.md)
- [using the logging API](logging.md)
- [using the module settings API](settings.md)
- [using the game client interface API / performing runtime DataCenter queries](client-interface.md)
- [showing graphical user interfaces](gui.md)
- [other features](other.md)

## Exemplary Modules
- TODO
