const mui = require('tera-toolbox-mui').DefaultInstance;
const { Connection, RealClient } = require('tera-network-proxy');

function onConnectionError(err) {
    switch (err.code) {
        case 'ETIMEDOUT':
            console.error(mui.get('connectionmanager/error-ETIMEDOUT-1', { address: err.address, port: err.port }));
            console.error(mui.get('connectionmanager/error-ETIMEDOUT-2'));
            console.error(mui.get('connectionmanager/error-ETIMEDOUT-3'));
            break;
        case 'ECONNABORTED':
        case 'ECONNRESET':
        case 'EPIPE':
            console.error(mui.get('connectionmanager/error-ECONNABORTED-ECONNRESET-EPIPE-1', { code: err.code }));
            console.error(mui.get('connectionmanager/error-ECONNABORTED-ECONNRESET-EPIPE-2'));
            console.error(mui.get('connectionmanager/error-ECONNABORTED-ECONNRESET-EPIPE-3'));
            break;
        default:
            console.error(err);
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

    start(target, socket, metadata, clientInterfaceConnection) {
        socket.setNoDelay(true);

        const connection = new Connection(this.moduleFolder, metadata, clientInterfaceConnection);

        const client = new RealClient(connection, socket);
        const srvConn = connection.connect(client, {
            host: target.ip,
            port: target.port
        });

        // Initialize server connection
        let remote = '???';

        socket.on('error', onConnectionError);

        srvConn.on('connect', () => {
            remote = `${socket.remoteAddress}:${socket.remotePort}`;
            console.log(mui.get('connectionmanager/connected', { remote, remoteAddress: srvConn.remoteAddress, remotePort: srvConn.remotePort }));

            connection.dispatch.moduleManager.loadAll();
            this.activeConnections.add(connection);
        });

        srvConn.on('error', (err) => {
            onConnectionError(err);
            this.activeConnections.delete(connection);
        });

        srvConn.on('close', () => {
            console.log(mui.get('connectionmanager/disconnected', { remote }));
            this.activeConnections.delete(connection);
        });
    }
}

module.exports = ConnectionManager;
