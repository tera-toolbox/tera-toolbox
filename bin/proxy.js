const mui = require('tera-toolbox-mui').DefaultInstance;
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

function LoadProtocolMap(version) {
    const parseMap = require('tera-data-parser').parsers.Map;
    const teradata = path.join(__dirname, '..', 'node_modules', 'tera-data');
    const filename = `protocol.${version}.map`;

    // Load base
    let baseMap = {};
    try {
        baseMap = parseMap(path.join(teradata, 'map_base', filename));
    } catch (e) {
        if (e.code !== 'ENOENT')
            throw e;
    }

    // Load custom
    let customMap = {};
    try {
        customMap = parseMap(path.join(teradata, 'map', filename));
    } catch (e) {
        if (e.code !== 'ENOENT')
            throw e;
    }

    return Object.assign(customMap, baseMap);
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
        this.clientInterfaceServer = new ClientInterfaceServer(global.TeraProxy.IsAdmin, config.interface_listenip || '127.0.0.10', config.interface_listenport || 9250, moduleFolder,
            client => {
                this.onClientInterfaceConnected(client);
            },
            () => {
                console.log(mui.get('proxy/ready'));
                this.running = true;
            },
            e => {
                console.log(mui.get('proxy/client-interface-error'));
                switch (e.code) {
                    case 'EADDRINUSE':
                        console.log(mui.get('proxy/client-interface-error-EADDRINUSE'));
                        break;
                    case 'EADDRNOTAVAIL':
                        console.log(mui.get('proxy/client-interface-error-EADDRNOTAVAIL'));
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

    redirect(name, ip, port, metadata, clientInterfaceConnection) {
        // Try to find server that's already listening
        const key = `${metadata.platform}-${metadata.region}-${metadata.environment}-${metadata.majorPatchVersion}.${metadata.minorPatchVersion}-${metadata.serverId}-${ip}:${port}`;
        const cached = clientInterfaceConnection.proxyServers.get(key);
        if (cached)
            return { ip: cached.address().address, port: cached.address().port };

        // Create a new server
        const net = require('net');
        const server = net.createServer(socket => this.connectionManager.start({ ip, port }, socket, metadata, clientInterfaceConnection));
        const listenPort = this.listenPort++;
        server.listen(listenPort, this.listenIp, () => {
            const { address: listen_ip, port: listen_port } = server.address();
            console.log(mui.get('proxy/redirecting-server', {name, region: metadata.region, serverId: metadata.serverId, listen_ip, listen_port, ip, port}));
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
                        console.log(mui.get('proxy/client-interface-connection-error', { error: data.error }));
                    } else {
                        const region = RegionFromLanguage(data.language);
                        client.info = data;
                        client.info.region = region.toLowerCase();
                        delete client.info.just_started;

                        console.log(mui.get('proxy/client-interface-connected', { justStarted: JustStarted, region, majorPatchVersion: data.majorPatchVersion, minorPatchVersion: data.minorPatchVersion }));

                        if (JustStarted) {
                            client.canInstallGPKs = true;
                            client.GPKManager.initialize(path.join(client.info.path, '..'));
                        }

                        client.moduleManager.loadAll();
                    }

                    client.canInstallGPKs = false;
                    if (JustStarted)
                        client.resume();
                    break;
                }
                case 'ready': {
                    client.info.protocolVersion = data.versionDataCenter;
                    client.info.sysmsg = data.sysmsg;

                    // Load protocol map
                    client.info.protocol = data.protocol || {};
                    try {
                        client.info.protocol = Object.assign(LoadProtocolMap(client.info.protocolVersion), client.info.protocol);

                        if (Object.keys(client.info.protocol).length === 0) {
                            console.warn(mui.get('proxy/warning-unmapped-protocol-1', { protocolVersion: client.info.protocolVersion, region: client.info.region, majorPatchVersion: client.info.majorPatchVersion, minorPatchVersion: client.info.minorPatchVersion }));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-2'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-3'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-4'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-5'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-6'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-7'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-8', { supportUrl: global.TeraProxy.SupportUrl }));
                        } else {
                            console.log(mui.get('proxy/protocol-loaded', { protocolVersion: client.info.protocolVersion, region: client.info.region, majorPatchVersion: client.info.majorPatchVersion, minorPatchVersion: client.info.minorPatchVersion }));
                        }
                    } catch (e) {
                        console.error(mui.get('proxy/error-cannot-load-protocol', { protocolVersion: client.info.protocolVersion, region: client.info.region, majorPatchVersion: client.info.majorPatchVersion, minorPatchVersion: client.info.minorPatchVersion }));
                        console.log(e);
                    }
                    break;
                }
                case 'get_sls': {
                    if (client.info && client.info.protocolVersion) {
                        // Store server list for use by mods
                        let serverlist = {};
                        data.servers.filter(server => server.ip !== this.listenIp).forEach(server => {
                            serverlist[server.id] = {
                                id: server.id,
                                category: server.category,
                                name: server.name,
                                ip: server.ip,
                                port: server.port
                            };
                        });

                        // Inject / patch proxy servers
                        const proxy_servers = data.servers.filter(server => !data.servers.some(other_server => other_server.id === server.id && other_server.ip === this.listenIp)).map(server => {
                            let patched_server = Object.assign({}, server);
                            if (!this.config.noslstags) {
                                const tag = ProxyTagFromLanguage(client.info.language);
                                patched_server.name += tag;
                                patched_server.title += tag;
                            }

                            const redirected_server_metadata = {
                                serverId: server.id,
                                serverList: serverlist,
                                platform: 'pc',
                                region: client.info.region,
                                environment: 'live', // TODO
                                majorPatchVersion: client.info.majorPatchVersion,
                                minorPatchVersion: client.info.minorPatchVersion,
                                protocolVersion: client.info.protocolVersion,
                                maps: {
                                    sysmsg: client.info.sysmsg,
                                    protocol: client.info.protocol
                                }
                            };

                            const redirected_server = this.redirect(server.name, server.ip, server.port, redirected_server_metadata, client);
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
            console.log(mui.get('proxy/client-interface-disconnected'));
            client.proxyServers.forEach(server => server.close());
            client.proxyServers.clear();
        });
    }
}

module.exports = TeraProxy;
