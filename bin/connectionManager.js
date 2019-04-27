const { Connection, RealClient } = require("tera-proxy-game");

function onConnectionError(err) {
    switch (err.code) {
        case 'ETIMEDOUT':
            console.error(`[connection] ERROR: Unable to connect to game server at ${err.address}:${err.port} (timeout)! Common reasons for this are:`);
            console.error("[connection] - An unstable internet connection or a geo-IP ban");
            console.error("[connection] - Game server maintenance");
            break;
        case 'ECONNRESET':
        case 'EPIPE':
            console.error(`[connection] ERROR: ${err.code} - Connection to game server was closed unexpectedly. Common reasons for this are:`);
            console.error("[connection] - A disconnect caused by an unstable internet connection");
            console.error("[connection] - An exploit/cheat or broken module that got you kicked");
            break;
        default:
            console.warn(err);
            break;
    }
}

class ConnectionManager {
    constructor(moduleFolder) {
        this.moduleFolder = moduleFolder;
        this.activeConnections = new Set;
    }

    destructor() {
        this.activeConnections.forEach(connection => connection.close());
        this.activeConnections.clear();
    }

    start(id, target, socket, region, regionShort, platform, majorPatch, minorPatch, protocolVersion, sysmsg, clientInterfaceConnection) {
        socket.setNoDelay(true);

        const connection = new Connection(this.moduleFolder, {
            serverId: id,
            region: region,
            regionShort: regionShort,
            majorPatch: majorPatch,
            minorPatch: minorPatch,
            protocol: protocolVersion,
            platform: platform,
            sysmsg: sysmsg,
            clientInterface: clientInterfaceConnection,
        });

        const client = new RealClient(connection, socket);
        const srvConn = connection.connect(client, {
            host: target.ip,
            port: target.port
        });

        connection.dispatch.moduleManager.loadAll();

        // Initialize server connection
        let remote = "???";

        socket.on("error", onConnectionError);

        srvConn.on("connect", () => {
            remote = socket.remoteAddress + ":" + socket.remotePort;
            console.log(`[connection] routing ${remote} to ${srvConn.remoteAddress}:${srvConn.remotePort}`);

            this.activeConnections.add(connection);
        });

        srvConn.on("error", (err) => {
            onConnectionError(err);
            this.activeConnections.delete(connection);
        });

        srvConn.on("close", () => {
            console.log(`[connection] ${remote} disconnected`);
            this.activeConnections.delete(connection);
        });
    }
}

module.exports = ConnectionManager;
