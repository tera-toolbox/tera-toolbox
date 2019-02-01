function RegionFromLanguage(language) {
    switch (language.toUpperCase()) {
        case 'USA':
            return 'NA';
        case 'EUR':
        case 'FRA':
        case 'GER':
            return 'EU';
        case 'KOR':
            return 'KR';
        case 'JP':
            return 'JP';
        case 'TW':
            return 'TW';
        case 'THA':
        case 'SE':
            return 'TH';
        case 'RUS':
            return 'RU';
        default:
            throw new Error(`Invalid language "${language}"!`);
    }
}

function ProxyTagFromLanguage(language) {
    switch (language.toUpperCase()) {
        case 'USA':
            return ' (Proxy)';
        case 'EUR':
        case 'FRA':
        case 'GER':
            return ' (Proxy)';
        case 'KOR':
            return ' (대리)';
        case 'JP':
            return '（プロキシ）';
        case 'TW':
            return '（代理）';
        case 'THA':
        case 'SE':
            return ' (Proxy)';
        case 'RUS':
            return ' (Прокси)';
        default:
            throw new Error(`Invalid language "${language}"!`);
    }
}

class TeraProxy {
    constructor(moduleFolder, config) {
        this.moduleFolder = moduleFolder;
        this.config = config;
        this.running = false;

        this.servers = new Map();
        this.listenIp = config.listenip || '127.0.0.20';
        this.listenPort = config.listenport || 9250;

        const ConnectionManager = require('./connectionManager');
        this.connectionManager = new ConnectionManager(moduleFolder);

        const ClientInterfaceServer = require('tera-client-interface');
        this.clientInterfaceServer = new ClientInterfaceServer('127.0.0.10', 9250, client => this.onClientInterfaceConnected(client));
    }

    destructor() {
        if (this.clientInterfaceServer) {
            this.clientInterfaceServer.destructor();
            this.clientInterfaceServer = null;
        }

        if (this.connectionManager) {
            this.connectionManager.destructor();
            this.connectionManager = null;
        }

        this.servers.forEach(server => server.close());
        this.servers.clear();

        this.running = false;
    }

    run() {
        this.running = true;

        // TODO: this is a dirty hack, implement a proper API for client/startup mods
        const { listModuleInfos } = require('tera-proxy-game').ModuleInstallation;
        listModuleInfos(this.moduleFolder).forEach(modInfo => {
            if (modInfo.options.loadOn === 'startup') {
                console.log(`[proxy] Loading startup module ${modInfo.name}`);
                try {
                    const modConstructor = require(modInfo.path);
                    modConstructor(null);
                } catch (e) {
                    console.log(`[proxy] Error loading startup module ${modInfo.name}:`);
                    console.log(e);
                }
            }
        });

        console.log('Ready, waiting for game client start!');
    }

    get hasActiveConnections() {
        return this.connectionManager.hasActiveConnections;
    }

    redirect(id, name, ip, port, region, regionShort, platform) {
        // Try to find server that's already listening
        const key = `${platform}-${region}-${id}-${ip}:${port}`;
        const cached = this.servers.get(key);
        if (cached)
            return { ip: cached.address().address, port: cached.address().port };

        // Create a new server
        const net = require('net');
        const server = net.createServer(socket => this.connectionManager.start(id, { ip, port }, socket, region, regionShort, platform));
        const listenPort = this.listenPort++;
        server.listen(listenPort, this.listenIp, () => {
            const { address: listen_ip, port: listen_port } = server.address();
            console.log(`[proxy] Redirecting ${name} (${region}-${id}) from ${listen_ip}:${listen_port} to ${ip}:${port}`);
        });

        this.servers.set(key, server);
        return { ip: this.listenIp, port: listenPort };
    }

    onClientInterfaceConnected(client) {
        client.on('data', (command, data) => {
            switch (command) {
                case 'info': {
                    client.info = data;
                    console.log(`[proxy] Client connected (${RegionFromLanguage(data.language)} v${data.major_patch}.${data.minor_patch})`);
                    break;
                }
                case 'get_sls': {
                    if (client.info) {
                        let proxy_servers = data.servers.map(server => {
                            let patched_server = Object.assign({}, server);

                            if (!this.config.noslstags) {
                                const tag = ProxyTagFromLanguage(client.info.language);
                                patched_server.name += tag;
                                patched_server.title += tag;
                            }

                            const region = RegionFromLanguage(client.info.language);
                            const platform = (client.info.major_patch <= 27) ? 'classic' : 'pc';
                            const redirected_server = this.redirect(server.id, server.name, server.ip, server.port, region, region.toLowerCase(), platform);
                            patched_server.ip = redirected_server.ip;
                            patched_server.port = redirected_server.port;

                            return patched_server;
                        });

                        data.servers = !this.config.noslstags ? [...proxy_servers, ...data.servers] : proxy_servers;
                    }

                    client.send("sls", data);
                    break;
                }
            }
        });

        client.on('disconnect', e => {
            console.log(`[proxy] Client disconnected`);
        });
    }
}

module.exports = TeraProxy;
