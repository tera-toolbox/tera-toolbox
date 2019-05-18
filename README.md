# TERA Toolbox
* Next generation of Tera-Proxy: Automatic updates, a graphical user interface, automated client mods, a direct connection to the game client (allowing e.g. realtime datacenter queries), and a lot more!
* Feel free to visit my Discord server at https://discord.gg/dUNDDtw
* Please check out [the documentation](doc/main.md) (especially if you want to develop your own modules)!
* Originally forked from https://github.com/pinkipi/tera-proxy which was DMCA'd by EME.

# Installation Instructions
* Download and run the setup from [the #toolbox channel in the Discord server](https://discord.gg/dUNDDtw) or [GitHub](https://github.com/tera-toolbox/tera-toolbox/releases/download/teratoolbox-setup/TeraToolbox.exe).
* Please make sure to read the instructions in the Discord channel. A manual installation from GitHub is possible (install Node.JS, download this repository, and run `npm i`), but not recommended!
* Run the shortcut created on your desktop (or `TeraToolbox.exe` in the installation folder) if you want to use toolbox with a graphical user interface (GUI; highly recommended!), or `TeraToolboxCLI.exe` in the installation folder for a command line interface (CLI).
* The first startup after installing TERA Toolbox may take a while, depending on your internet connection. This is because all required files will be downloaded and updated automatically.
* The most popular mods are already pre-installed for your convenience - check out the `My Mods` page. If you don't want to use a particular module, just uninstall or disable it there.
* Check out the `Get More Mods` page for mods you want to install, and the `Settings` page to configure TERA Toolbox according to your needs.
* Once you're all set, press the `Start!` button in the top right corner, then start the game as usual.

# Installing Mods
It is highly recommended that you use the `Get More Mods` page in the graphical user interface that comes with TERA Toolbox to manage your installed mods. If you want to install them manually, [here's the list of mods that appears on that page](https://raw.githubusercontent.com/tera-toolbox/tera-mods/master/modulelist.txt).

# Developers: Adding auto-update compatibility to your module
***TBD: this is outdated and will be rewritten/moved to documentation soon.***
* You'll need to create two files in your root update directory (called UpdateRoot from now on): `module.json` and `manifest.json`.
* `module.json` contains the UpdateRoot URL and optional other data. See [here](https://github.com/caali-hackerman/data-logger/blob/master/update/CaaliLogger/module.json) for an example. If you're distributing paid modules, you can add a `drmKey` parameter representing a unique per-user key (string) there as well. It'll be sent as a HTTP GET parameter when `manifest.json` is requested.
* `manifest.json` contains a list of all files required for your module (relative to its root directory) and their corresponding SHA256 hashes. Furthermore, you must specify a list of all packet definitions and versions required by your module here. See [here](https://github.com/caali-hackerman/data-logger/blob/master/update/CaaliLogger/manifest.json) for an example. If you have files that shouldn't be overwritten, you can use `{"overwrite": false, "hash": [file hash]}` instead of just a string on a per-file basis. You can also specify for which game regions a file is downloaded.
* That's it! All you need to do now is tell your users to delete any legacy version of your module that they have already installed, and place the `module.json` file in a new, empty directory in their `mods/` folder. `manifest.json` must not be distributed to your users, it only has to reside in your UpdateRoot and will be processed by proxy automatically. The proxy will recognize the module as auto-updating compatible and install all files from your UpdateRoot. It will also download required packet definitions, if necessary. If you want to have your module listed in the "Get More Mods" tab, please contact me.
* SaltyMonkey wrote a neat tool that generates `manifest.json` automatically for you (though you might want to manually adjust stuff afterwards): https://github.com/SaltyMonkey/SHAGen/releases/
* Whenever you push an update, remember to update `manifest.json` as well!
* Keep in mind that everytime the user logs in, all files with checksums mismatching those in your manifest.json will be overwritten. This will overwrite any changes the user has made to them!
* Make sure to disable git auto-line ending conversion (`git config --global core.autocrlf false`) before pushing your updated files. This will ensure that your file contents won't be modified, so that the SHA256 hashes you generated for `manifest.json` won't become invalid!
* If you have any further questions on how to make your module compatible, feel free to ask me via PM or in my Slack server!
