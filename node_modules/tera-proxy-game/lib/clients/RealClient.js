class RealClient {
  constructor(connection, socket) {
    this.connection = connection;
    this.socket = socket;
    this.session = null;

    const bufferType = this.connection.info.console ? require('../packetBufferConsole') : require('../packetBuffer');
    this.buffer = new bufferType();
    
    this.builder = this.connection.info.console ? require('../packetBuilderConsole') : require('../packetBuilder');

    socket.on('data', (data) => {
      if (!this.connection) return;
      switch (this.connection.state) {
        case 0: {
          if (data.length === 128) {
            this.connection.setClientKey(data);
          }
          break;
        }

        case 1: {
          if (data.length === 128) {
            this.connection.setClientKey(data);
          }
          break;
        }

        case 2: {
          this.session.decrypt(data);
          this.buffer.write(data);

          const { dispatch } = this.connection;

          // eslint-disable-next-line no-cond-assign
          while (data = this.buffer.read()) {
            if (dispatch) {
              data = dispatch.handle(data, false);
            }
            if (data) {
              this.connection.sendServer(data);
            }
          }

          break;
        }

        default: {
          // ???
          break;
        }
      }
    });

    socket.on('close', () => {
      this.socket = null;
      this.close();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  onConnect() {
  }

  onData(data) {
    if (!this.connection) return;
    if (this.connection.state === 2) {
      if (!this.session) {
        this.session = this.connection.session.cloneKeys();
      } else {
        data = this.builder(data);        
        this.session.encrypt(data);
      }
    }
    this.socket.write(data);
  }

  close() {
    if (this.socket) {
      this.socket.end();
      this.socket.unref();
      this.socket = null;
    }

    const { connection } = this;
    if (connection) {
      this.connection = null; // prevent infinite recursion
      connection.close();
    }

    this.session = null;
    this.buffer = null;
  }
}

module.exports = RealClient;
