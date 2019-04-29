const path = require('path');

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
        case 'JPN':
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
        case 'JPN':
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

        this.listenIp = config.listenip || '127.0.0.20';
        this.listenPort = config.listenport || 9250;

        const ConnectionManager = require('./connectionManager');
        this.connectionManager = new ConnectionManager(moduleFolder);

        const ClientInterfaceServer = require('tera-client-interface');
        this.clientInterfaceServer = new ClientInterfaceServer('127.0.0.10', 9250, moduleFolder,
            client => {
                this.onClientInterfaceConnected(client);
            },
            () => {
                console.log('[toolbox] Ready, waiting for game client start!');
                this.running = true;
            },
            e => {
                console.log('[toolbox] ERROR: Unable to start client interface server.');
                switch (e.code) {
                    case 'EADDRINUSE':
                        console.log('[toolbox] ERROR: Another instance of TERA Toolbox is already running. Please close it and try again!');
                        break;
                    default:
                        console.log(e);
                        break;
                }
            }
        );
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

        this.running = false;
    }

    run() {
        this.clientInterfaceServer.run();
    }

    get hasActiveConnections() {
        return this.connectionManager.hasActiveConnections;
    }

    redirect(id, name, ip, port, region, regionShort, platform, majorPatch, minorPatch, protocolVersion, sysmsg, clientInterfaceConnection) {
        // Try to find server that's already listening
        const key = `${platform}-${region}-${majorPatch}.${minorPatch}-${id}-${ip}:${port}`;
        const cached = clientInterfaceConnection.proxyServers.get(key);
        if (cached)
            return { ip: cached.address().address, port: cached.address().port };

        // Create a new server
        const net = require('net');
        const server = net.createServer(socket => this.connectionManager.start(id, { ip, port }, socket, region, regionShort, platform, majorPatch, minorPatch, protocolVersion, sysmsg, clientInterfaceConnection));
        const listenPort = this.listenPort++;
        server.listen(listenPort, this.listenIp, () => {
            const { address: listen_ip, port: listen_port } = server.address();
            console.log(`[toolbox] Redirecting ${name} (${region}-${id}) from ${listen_ip}:${listen_port} to ${ip}:${port}`);
        });

        clientInterfaceConnection.proxyServers.set(key, server);
        return { ip: this.listenIp, port: listenPort };
    }

    onClientInterfaceConnected(client) {
        client.proxyServers = new Map();
        client.on('data', (command, data) => {
            switch (command) {
                case 'info': {
                    const JustStarted = data.just_started;

                    if (data.error) {
                        console.log(`[toolbox] Unable to establish connection to client: ${data.error}`);
                    } else {
                        const region = RegionFromLanguage(data.language);
                        client.info = data;
                        client.info.region = region.toLowerCase();
                        delete client.info.just_started;

                        console.log(`[toolbox] Client ${JustStarted ? 'connected' : 'reconnected'} (${region} v${data.majorPatchVersion}.${data.minorPatchVersion})`);

                        if (JustStarted) {
                            client.GPKManager.initialize(path.join(client.info.path, '..'));
                            client.moduleManager.loadAll();
                        }
                    }

                    if (JustStarted)
                        client.resume();
                    break;
                }
                case 'ready': {
                    client.info.protocolVersion = data.versionDataCenter;
                    client.info.sysmsg = data.sysmsg;
                    break;
                }
                case 'get_sls': {
                    if (client.info && client.info.protocolVersion) {
                        let proxy_servers = data.servers.filter(server => !data.servers.some(other_server => other_server.id === server.id && other_server.ip === this.listenIp)).map(server => {
                            let patched_server = Object.assign({}, server);

                            if (!this.config.noslstags) {
                                const tag = ProxyTagFromLanguage(client.info.language);
                                patched_server.name += tag;
                                patched_server.title += tag;
                            }

                            const redirected_server = this.redirect(server.id, server.name, server.ip, server.port, RegionFromLanguage(client.info.language), client.info.region, 'pc', client.info.majorPatchVersion, client.info.minorPatchVersion, client.info.protocolVersion, client.info.sysmsg, client);
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
            console.log(`[toolbox] Client disconnected`);
            client.proxyServers.forEach(server => server.close());
            client.proxyServers.clear();
        });
    }
}

module.exports = TeraProxy;
