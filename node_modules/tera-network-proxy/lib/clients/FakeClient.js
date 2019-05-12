const crypto = require('crypto');
const events = require('events');

class FakeClient extends events.EventEmitter {
  constructor(connection, keys) {
    super();
    this.connection = connection;
    this.connected = false;

    if (!keys) {
      keys = [
        crypto.randomBytes(128),
        crypto.randomBytes(128),
      ];
    } else {
      if (!Array.isArray(keys)) throw new Error('"keys" must be an array');
      if (keys.length !== 2) throw new Error('client must provide two keys');
      keys.forEach((key) => {
        if (key.length !== 128) {
          throw new Error('keys must be 128 bytes');
        }
      });
    }

    this.keys = keys;
  }

  onConnect(serverConnection) {
    serverConnection.on('timeout', () => {
      this.emit('timeout');
    });

    serverConnection.on('error', (err) => {
      this.emit('error', err);
    });
  }

  onData() {
    const { state } = this.connection;
    switch (state) {
      case 0:
      case 1: {
        process.nextTick(() => {
          this.connection.setClientKey(this.keys[state]);
        });
        break;
      }
      case 2: {
        if (!this.connected) {
          this.connected = true;
          this.emit('connect');
        }
        break;
      }
      default: {
        // ???
        break;
      }
    }
  }

  close() {
    const { connection } = this;
    if (connection) {
      this.emit('close');
      this.connection = null; // prevent infinite recursion
      connection.close();
    }

    this.keys = null;
  }
}

module.exports = FakeClient;
