const mui = require('tera-toolbox-mui').DefaultInstance;
const path = require('path');
const fs = require('fs');

function PublisherFromLanguage(language) {
    switch (language.toUpperCase()) {
        case 'EUR':
        case 'FRA':
        case 'GER':
        case 'RUS':
            return 'GF';
        case 'KOR':
            return 'BH';
        case 'JPN':
            return 'PM';
        case 'TW':
            return 'M5';
        default:
            throw new Error(`Invalid language "${language}"!`);
    }
}

function TagFromLanguage(language) {
    return ' (Toolbox)';
}

function LoadProtocolMap(dataFolder, version) {
    const parseMap = require('tera-data-parser').parsers.Map;
    const filename = `protocol.${version}.map`;

    // Load base
    const data = JSON.parse(fs.readFileSync(path.join(dataFolder, 'data.json')));
    let baseMap = data.maps[version] || {};

    // Load custom
    let customMap = {};
    try {
        customMap = parseMap(path.join(dataFolder, 'opcodes', filename));
    } catch (e) {
        if (e.code !== 'ENOENT')
            throw e;
    }

    return Object.assign(customMap, baseMap);
}

class TeraProxy {
    constructor(modFolder, dataFolder, config) {
        this.modFolder = modFolder;
        this.dataFolder = dataFolder;
        this.config = config;
        this.running = false;

        this.listenIp = config.listenip || '127.0.0.20';
        this.listenPort = config.listenport || 9250;

        const ModManager = require('./mod-manager');
        this.modManager = new ModManager(this.modFolder);
        this.modManager.loadAll();

        const ConnectionManager = require('./connection-manager');
        this.connectionManager = new ConnectionManager(this.modManager);

        const ClientInterfaceServer = require('tera-client-interface');
        this.clientInterfaceServer = new ClientInterfaceServer(global.TeraProxy.IsAdmin, config.interface_listenip || '127.0.0.10', config.interface_listenport || 9250,
            client => {
                this.onClientInterfaceConnected(client);
            },
            () => {
                console.log(mui.get('proxy/ready'));
                this.running = true;
            },
            e => {
                console.error(mui.get('proxy/client-interface-error'));
                switch (e.code) {
                    case 'EADDRINUSE':
                        console.error(mui.get('proxy/client-interface-error-EADDRINUSE'));
                        break;
                    case 'EADDRNOTAVAIL':
                        console.error(mui.get('proxy/client-interface-error-EADDRNOTAVAIL'));
                        break;
                    default:
                        console.error(e);
                        break;
                }
            }
        );
    }

    destructor() {
        if (this.modManager) {
            this.modManager.destructor();
            this.modManager = null;
        }

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
        const key = `${metadata.platform}-${metadata.publisher}-${metadata.environment}-${metadata.majorPatchVersion}.${metadata.minorPatchVersion}-${metadata.serverId}-${ip}:${port}`;
        const cached = clientInterfaceConnection.proxyServers.get(key);
        if (cached)
            return { ip: cached.address().address, port: cached.address().port };

        // Create a new server
        const net = require('net');
        const server = net.createServer(socket => this.connectionManager.start({ ip, port }, socket, metadata, clientInterfaceConnection));
        const listenPort = this.listenPort++;
        server.listen(listenPort, this.listenIp, () => {
            const { address: listen_ip, port: listen_port } = server.address();
            console.log(mui.get('proxy/redirecting-server', { name, publisher: metadata.publisher, serverId: metadata.serverId, listen_ip, listen_port, ip, port}));
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
                        console.error(mui.get('proxy/client-interface-connection-error', { error: data.error }));
                        if (JustStarted)
                            client.resume();
                    } else {
                        client.info = data;
                        client.info.language = client.info.language.toLowerCase();
                        client.info.publisher = PublisherFromLanguage(data.language).toLowerCase();
                        client.info.platform = 'pc';
                        client.info.environment = 'live'; // TODO
                        delete client.info.just_started;

                        console.log(mui.get('proxy/client-interface-connected', { justStarted: JustStarted, publisher: client.info.publisher, majorPatchVersion: data.majorPatchVersion, minorPatchVersion: data.minorPatchVersion }));

                        this.modManager.loadAllClient(client);

                        if (JustStarted) {
                            client.GPKManager.initialize(path.join(client.info.path, '..'));
                            this.modManager._installAllClient(client).then(() => client._installGPKs());
                        }
                    }

                    break;
                }
                case 'installgpksresult': {
                    if (!data.success) {
                        console.error(mui.get('proxy/error-installing-gpks'));
                        console.error(data.error);
                    }
                    client.resume();
                    break;
                }
                case 'ready': {
                    client.info.protocolVersion = data.protocolVersion;
                    client.info.sysmsgVersion = data.sysmsgVersion;
                    client.info.sysmsg = data.sysmsg;

                    // Load protocol map
                    client.info.protocol = data.protocol || {};
                    try {
                        client.info.protocol = Object.assign(LoadProtocolMap(this.dataFolder, client.info.protocolVersion), client.info.protocol);

                        if (Object.keys(client.info.protocol).length === 0) {
                            console.warn(mui.get('proxy/warning-unmapped-protocol-1', { protocolVersion: client.info.protocolVersion, publisher: client.info.publisher, majorPatchVersion: client.info.majorPatchVersion, minorPatchVersion: client.info.minorPatchVersion }));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-2'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-3'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-4'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-5'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-6'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-7'));
                            console.warn(mui.get('proxy/warning-unmapped-protocol-8', { supportUrl: global.TeraProxy.SupportUrl }));
                        } else {
                            console.log(mui.get('proxy/protocol-loaded', { protocolVersion: client.info.protocolVersion, publisher: client.info.publisher, majorPatchVersion: client.info.majorPatchVersion, minorPatchVersion: client.info.minorPatchVersion }));
                        }
                    } catch (e) {
                        console.error(mui.get('proxy/error-cannot-load-protocol', { protocolVersion: client.info.protocolVersion, publisher: client.info.publisher, majorPatchVersion: client.info.majorPatchVersion, minorPatchVersion: client.info.minorPatchVersion }));
                        console.error(e);
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
                                address: server.address || server.ip,
                                port: server.port
                            };
                        });

                        // Inject / patch proxied servers
                        const proxy_servers = data.servers.filter(server => !data.servers.some(other_server => other_server.id === server.id && other_server.ip === this.listenIp)).map(server => {
                            let patched_server = Object.assign({}, server);
                            if (!this.config.noslstags)
                                patched_server.title += TagFromLanguage(client.info.language);

                            const redirected_server_metadata = {
                                dataFolder: this.dataFolder,
                                serverId: server.id,
                                serverList: serverlist,
                                platform: client.info.platform,
                                publisher: client.info.publisher,
                                environment: client.info.environment,
                                language: client.info.language,
                                majorPatchVersion: client.info.majorPatchVersion,
                                minorPatchVersion: client.info.minorPatchVersion,
                                protocolVersion: client.info.protocolVersion,
                                maps: {
                                    sysmsg: client.info.sysmsg,
                                    protocol: client.info.protocol
                                }
                            };

                            const redirected_server = this.redirect(server.name, server.address || server.ip, server.port, redirected_server_metadata, client);
                            patched_server.ip = redirected_server.ip;
                            patched_server.port = redirected_server.port;
                            if (server.address)
                                delete patched_server.address;
                            return patched_server;
                        });
                        
                        if (this.config.noserverautojoin)
                            data.default_server_id = 0

                        data.servers = !this.config.noslstags ? [...proxy_servers, ...data.servers] : proxy_servers;

                        if (this.config.removecounters) {
                            for (let server in Object.keys(data.servers)) {
                                data.servers[server].title = data.servers[server].title.replace(/\s+\(\d+\)/g, "");
                            }
                        }
                    }

                    client.send("sls", data);
                    break;
                }
            }
        });

        client.on('disconnect', e => {
            if (this.modManager)
                this.modManager.unloadAllClient(client);

            console.log(mui.get('proxy/client-interface-disconnected'));
            client.proxyServers.forEach(server => server.close());
            client.proxyServers.clear();
        });
    }
}

module.exports = TeraProxy;
