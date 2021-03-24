const mui = require('tera-toolbox-mui').DefaultInstance;
const { Connection, RealClient } = require('tera-network-proxy');

function onConnectionError(err) {
    switch (err.code) {
        case 'ECONNREFUSED':
        case 'ETIMEDOUT':
            console.error(mui.get('connection-manager/error-ECONNREFUSED-ETIMEDOUT-1', { address: err.address, port: err.port, code: err.code }));
            console.error(mui.get('connection-manager/error-ECONNREFUSED-ETIMEDOUT-2'));
            console.error(mui.get('connection-manager/error-ECONNREFUSED-ETIMEDOUT-3'));
            break;
        case 'ECONNABORTED':
        case 'ECONNRESET':
        case 'EPIPE':
            console.error(mui.get('connection-manager/error-ECONNABORTED-ECONNRESET-EPIPE-1', { code: err.code }));
            console.error(mui.get('connection-manager/error-ECONNABORTED-ECONNRESET-EPIPE-2'));
            console.error(mui.get('connection-manager/error-ECONNABORTED-ECONNRESET-EPIPE-3'));
            break;
        default:
            console.error(err);
            break;
    }
}

class ConnectionManager {
    constructor(modManager) {
        this.modManager = modManager;
        this.activeConnections = new Set;
    }

    destructor() {
        this.activeConnections.forEach(connection => connection.close());
        this.activeConnections.clear();
    }

    start(target, socket, metadata, clientInterfaceConnection) {
        socket.setNoDelay(true);

        const connection = new Connection(metadata, clientInterfaceConnection);
        const dispatch = connection.dispatch;

        const client = new RealClient(connection, socket);
        const srvConn = connection.connect(client, {
            host: target.ip,
            port: target.port
        });

        // Initialize server connection
        let remote = '???';

        socket.on('error', onConnectionError);

        srvConn.on('connect', () => {
            if (!connection.dispatch) {
                connection.close();
            } else {
                remote = `${socket.remoteAddress}:${socket.remotePort}`;
                console.log(mui.get('connection-manager/connected', { remote, remoteAddress: srvConn.remoteAddress, remotePort: srvConn.remotePort }));

                this.modManager.loadAllNetwork(connection.dispatch);
                this.activeConnections.add(connection);
            }
        });

        srvConn.on('error', (err) => {
            this.modManager.unloadAllNetwork(dispatch);

            onConnectionError(err);
            this.activeConnections.delete(connection);
        });

        srvConn.on('close', () => {
            this.modManager.unloadAllNetwork(dispatch);

            console.log(mui.get('connection-manager/disconnected', { remote }));
            this.activeConnections.delete(connection);
        });
    }
}

module.exports = ConnectionManager;
