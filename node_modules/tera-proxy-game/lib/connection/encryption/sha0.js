/* eslint-disable no-bitwise, no-plusplus */

// original C# source:
// https://github.com/P5yl0/TeraEmulator_2117a/blob/master/Tera_Emulator_Source_2117/GameServer/Crypt/Sha.cs

function leftRotate(x, n) {
  return (x << n) | (x >>> (32 - n));
}

class Sha0 {
  constructor() {
    this.digest = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    this.block = Buffer.alloc(64);
    this.blockIndex = 0;
    this.lengthHigh = 0;
    this.lengthLow = 0;
    this.computed = false;
  }

  update(buffer) {
    for (const b of buffer) {
      this.block[this.blockIndex++] = b;
      this.lengthLow += 8;
      this.lengthLow &= 0xFFFFFFFF;
      if (this.lengthLow === 0) {
        this.lengthHigh++;
        this.lengthHigh &= 0xFFFFFFFF;
      }
      if (this.blockIndex === 64) {
        this.processMessageBlock();
      }
    }
  }

  processMessageBlock() {
    const w = Array(80);

    // initialize the first 16 words in the array W
    for (let t = 0; t < 16; t++) {
      w[t] = this.block.readUInt32BE(t * 4);
    }

    for (let t = 16; t < 80; t++) {
      w[t] = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16];
    }

    let [a, b, c, d, e] = this.digest;
    for (let t = 0; t < 80; t++) {
      let temp = leftRotate(a, 5) + e + w[t];
      if (t < 20) {
        temp += (b & c) | ((~b) & d);
        temp += 0x5A827999;
      } else if (t < 40) {
        temp += b ^ c ^ d;
        temp += 0x6ED9EBA1;
      } else if (t < 60) {
        temp += (b & c) | (b & d) | (c & d);
        temp += 0x8F1BBCDC;
      } else {
        temp += b ^ c ^ d;
        temp += 0xCA62C1D6;
      }
      e = d;
      d = c;
      c = leftRotate(b, 30);
      b = a;
      a = temp & 0xFFFFFFFF;
    }

    this.digest[0] = (this.digest[0] + a) & 0xFFFFFFFF;
    this.digest[1] = (this.digest[1] + b) & 0xFFFFFFFF;
    this.digest[2] = (this.digest[2] + c) & 0xFFFFFFFF;
    this.digest[3] = (this.digest[3] + d) & 0xFFFFFFFF;
    this.digest[4] = (this.digest[4] + e) & 0xFFFFFFFF;
    this.blockIndex = 0;
  }

  padMessage() {
    // Check to see if the current message block is too small to hold
    // the initial padding bits and length.  If so, we will pad the
    // block, process it, and then continue padding into a second
    // block.
    this.block[this.blockIndex++] = 0x80;

    if (this.blockIndex > 56) {
      this.block.fill(0, this.blockIndex, 64);
      this.processMessageBlock();
    }

    if (this.blockIndex < 56) {
      this.block.fill(0, this.blockIndex, 56);
    }

    // bitop converts to signed
    this.block.writeInt32BE(this.lengthHigh, 56);
    this.block.writeInt32BE(this.lengthLow, 60);
    this.processMessageBlock();
  }

  hash() {
    if (!this.computed) {
      this.padMessage();
      this.computed = true;
    }

    const out = Buffer.allocUnsafe(20);
    for (let t = 0; t < 5; t++) {
      // bitop converts to signed
      out.writeInt32BE(this.digest[t] & 0xFFFFFFFF, t * 4);
    }
    return out;
  }
}

module.exports = Sha0;
