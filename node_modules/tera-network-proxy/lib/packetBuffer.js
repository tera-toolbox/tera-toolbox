class PacketBuffer {
  constructor() {
    this.buffer = null;
    this.position = 0;
    this.out = [];
  }

  write(data) {
    // we'll chop off the front of `data` with each loop
    while (data.length > 0) {
      // if we have a buffer prepared, we should append to it first
      if (this.buffer != null) {
        // if our buffer size is less than 2, we'll need to compute the full size
        if (this.buffer.length < 2) {
          /* eslint-disable no-bitwise */
          const old = this.buffer[0];        // save old byte
          const size = (data[0] << 8) + old; // convert from little-endian
          this.buffer = Buffer.alloc(size);  // make new buffer
          this.buffer[0] = old;              // write old value
          this.position = 1;                 // update position
          /* eslint-enable no-bitwise */
        }

        // write as many bytes as we can
        const remaining = Math.min(data.length, this.buffer.length - this.position);
        data.copy(this.buffer, this.position, 0, remaining);
        this.position += remaining;

        // if we filled the buffer, push it
        if (this.position === this.buffer.length) {
          this.out.push(this.buffer);
          this.buffer = null;
          this.position = 0;
        }

        // chop off the front and keep going
        data = data.slice(remaining);
        continue;
      }

      // if it's too small to read the size value, just save it in the buffer and
      // we'll hopefully get to it the next time around
      if (data.length < 2) {
        this.buffer = Buffer.from(data);
        this.position = data.length;
        break;
      }

      // otherwise, read the size value, and if it's bigger than the size of the
      // data we have, we should save it in the buffer
      const size = data.readUInt16LE(0);
      if (size > data.length) {
        this.buffer = Buffer.alloc(size);
        data.copy(this.buffer);
        this.position = data.length;
        break;
      }

      // otherwise, just push it and chop off the front, then keep going
      this.out.push(data.slice(0, size));
      data = data.slice(size);
    }
  }

  read() {
    return this.out.shift();
  }
}

module.exports = PacketBuffer;
