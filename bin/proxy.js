// Host file modification
function HostsError(e) {
    function printEdits() {
        if (!e.list) {
            console.error(`  * Either run with 'sudo' (not recommended) or manually add the hosts to ${e.path}`);
            return;
        }
        console.error(`  * Either run with 'sudo' (not recommended) or change the following in ${e.path}:`);
        for (var i = 0, list = e.list, l = list.length; i < l; i++) {
            var entry = list[i];
            if (entry[2] == 1) { console.error(`Add the line: ${entry[0]} ${entry[1]}`); }
            else { console.error(`Change the line for ${entry[1]} to: ${entry[0]} ${entry[1]}`); }
        }
    }
    let isWindows = process.platform === 'win32';
    switch (e.code) {
        case "EACCES":
            console.error('ERROR: Hosts file is set to read-only.');
            if (isWindows) {
                console.error('  * Make sure no anti-virus software is running.')
                console.error(`  * Locate "${e.path}", right click the file, click 'Properties', uncheck 'Read-only' then click 'OK'.`);
            } else { printEdits(); }
            break;
        case "EBUSY":
            console.error('ERROR: Hosts file is busy and cannot be written to.');
            if (isWindows) {
                console.error('  * Make sure no anti-virus software is running.');
                console.error(`  * Try deleting "${e.path}".`);
            } else {
                console.error(`  * End any processes locking ${e.path}`);
                printEdits();
            }
            break;
        case "EPERM":
            console.error('ERROR: Insufficient permission to modify hosts file.');
            if (isWindows) {
                console.error('  * Make sure no anti-virus software is running.');
                console.error('  * Right click TeraProxy.bat and select \'Run as administrator\'.');
            } else { printEdits(); }
            break;
        case "ENOENT":
            console.error('ERROR: Unable to write to hosts file.');
            if (isWindows) {
                console.error('  * Make sure no anti-virus software is running.');
                console.error('  * Right click TeraProxy.bat and select \'Run as administrator\'.');
            } else { printEdits(); }
            break;
    }

    throw e;
}

function HostsInitialize(region) {
    if (region && region.platform !== 'console') {
        try {
            const hosts = require("./hosts");
            var list = [[region.data.listenHostname, region.data.hostname]];
            for (let x of region.data.altHostnames)
                list.push([region.data.listenHostname, x]);
            hosts.setMany(list);
        } catch (e) {
            HostsError(e);
        }

        console.log("[proxy] hosts file patched");
    }
}

function HostsClean(region) {
    // Only clean hosts file on Windows as other platforms (for now) have to do all hosts edits manually
    if (region && region.platform !== 'console' && process.platform === 'win32') {
        try {
            const hosts = require("./hosts");
            var list = [[region.data.listenHostname, region.data.hostname]];
            for (let x of region.data.altHostnames)
                list.push([region.data.listenHostname, x]);
            hosts.removeMany(list);
        } catch (e) {
            HostsError(e);
        }
    }
}

// Proxy implementation
function ListenError(e, port) {
    switch (e.code) {
        case "EADDRINUSE":
            console.error("ERROR: Another instance of TeraProxy is already running, please close it then try again.");
            break;
        case "EACCES":
            console.error(`ERROR: Another process is already using port ${port}.\nPlease close or uninstall the application first:`);
            require("./netstat")(port);
            break;
        default:
            throw e;
    }

    process.exit();
}

class TeraProxy {
    constructor(moduleFolder, config, region) {
        this.moduleFolder = moduleFolder;
        this.config = config;
        this.region = region;
        this.running = false;

        this.servers = new Map();
        this.slsInit();

        const ConnectionManager = require('./connectionManager');
        this.connectionManager = new ConnectionManager(moduleFolder, this.region.id, this.region.idShort, this.region.platform);
    }

    destructor() {
        if (this.connectionManager) {
            this.connectionManager.destructor();
            this.connectionManager = null;
        }

        HostsClean(this.region);
        this.slsDestroy();

        this.servers.forEach(server => server.close());
        this.servers.clear();

        this.running = false;
    }

    run() {
        this.running = true;

        console.log(`[proxy] Tera-Proxy configured for region ${this.region.id}!`);

        // TODO remove this - show GUI update notification
        if (!process.versions.electron) {
            console.log(`[info] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
            console.log(`[info] Tera-Proxy now comes with an official graphical user interface!`);
            console.log(`[info] If you want to use it, please check out the #proxy-news channel`);
            console.log(`[info] in ${global.TeraProxy.DiscordUrl} for further information!`);
            console.log(`[info] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        }

        HostsClean(this.region);
        this.slsListen();

        // TODO: this is a dirty hack, implement a proper API for client/startup mods
        const { listModuleInfos } = require('tera-proxy-game').ModuleInstallation;
        listModuleInfos(this.moduleFolder).forEach(modInfo => {
            if (modInfo.options.loadOn === "startup") {
                console.log(`[proxy] Loading startup module ${modInfo.name}`);
                try {
                    const modConstructor = require(modInfo.path);
                    modConstructor(this.region.idShort);
                } catch (e) {
                    console.log(`[proxy] Error loading startup module ${modInfo.name}:`);
                    console.log(e);
                }
            }
        });
    }

    get hasActiveConnections() {
        return this.connectionManager.hasActiveConnections;
    }

    slsInit() {
        if (this.region.platform !== 'console') {
            const SlsProxy = require("tera-proxy-sls");
            this.slsProxy = new SlsProxy(this.region.data);
        } else {
            this.slsProxy = null;
        }
    }

    slsListenHandler(err) {
        if (err) {
            ListenError(err, this.region.data.port);
        } else {
            HostsInitialize(this.region);

            for (let i = this.servers.entries(), step; !(step = i.next()).done;) {
                const [id, server] = step.value;
                const currentCustomServer = this.region.data.customServers[id];

                server.listen(currentCustomServer.port, currentCustomServer.ip || "127.0.0.1", () => {
                    const { address, port } = server.address();
                    console.log(`[proxy] listening on ${address}:${port}`);
                });
            }
        }
    }

    slsListen() {
        const net = require("net");

        if (this.region.platform !== 'console') {
            const dns = require("dns");
            dns.setServers(this.config.dnsservers || ["8.8.8.8", "8.8.4.4"]);

            // For some reason, node's http request timeout doesn't always work, so add a workaround here.
            let slsTimeout = setTimeout(() => {
                console.error("ERROR: Timeout while trying to load the server list.");
                console.error("This is NOT a proxy issue. Your connection to the official servers is not working properly!");
                console.error("Try restarting/resetting your router and your computer. That might solve the issue.");
                process.exit(1);
            }, 5000);

            this.slsProxy.fetch((err, gameServers) => {
                if (err) {
                    console.error(`ERROR: Unable to load the server list: ${err}`);
                    console.error("This is almost always caused by");
                    console.error(" - your setup (invasive virus scanners, viruses, ...)");
                    console.error(" - your internet connection (unstable/broken connection, improper configuration, geo-IP ban from the game region you're trying to play on, ...)");
                    console.error(" - game servers being down for maintenance");
                    console.error("Please test if you can regularly play the game (without proxy). If you can't, it's not a proxy issue, but one of the above.");
                    console.error("You can also try restarting/resetting your router and your computer.");
                    process.exit(1);
                }

                for (let i = 0, arr = Object.keys(this.region.data.customServers), len = arr.length; i < len; ++i) {
                    const id = arr[i];
                    const target = gameServers[id];
                    if (!target) {
                        console.error(`[sls] WARNING: Server ${id} not found`);
                        continue;
                    }

                    const server = net.createServer(socket => this.connectionManager.start(id, target, socket));
                    this.servers.set(id, server);
                }

                this.slsProxy.listen(this.region.data.listenHostname, err => this.slsListenHandler(err));
                clearTimeout(slsTimeout);
            });
        } else {
            for (let i = 0, arr = Object.keys(this.region.data.customServers), len = arr.length; i < len; ++i) {
                const id = arr[i];
                const target = this.region.data.customServers[id]["remote"];

                const server = net.createServer(socket => this.connectionManager.start(id, target, socket));
                this.servers.set(id, server);
            }

            this.slsListenHandler();
        }
    }

    slsDestroy() {
        if (this.region && this.region.platform === 'console')
            return;

        if (this.slsProxy) {
            this.slsProxy.close();
            this.slsProxy = null;
        }
    }
}

module.exports = TeraProxy;
