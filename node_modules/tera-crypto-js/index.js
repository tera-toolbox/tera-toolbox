// original C# source:
// https://github.com/P5yl0/TeraEmulator_2117a/tree/master/Tera_Emulator_Source_2117/GameServer/Crypt

/* ---------- *
 * CryptorKey *
 * ---------- */
function CryptorKey(size, pos2) {
  this.size = size;
  this.sum = 0;
  this.key = 0;
  this.pos1 = 0;
  this.pos2 = pos2;
  this.buffer = new Uint32Array(this.size);
}

/* ------- *
 * TeraCrypto *
 * ------- */
class TeraCrypto {
  constructor(data) {
    this.changeData = 0;
    this.changeLen = 0;
    
    this.keys = [
      new CryptorKey(55, 31),
      new CryptorKey(57, 50),
      new CryptorKey(58, 39),
    ];
    
    for (let i = 0; i < 55; i++)
      this.keys[0].buffer[i] = data.readUInt32LE(i * 4);
    for (let i = 0; i < 57; i++)
      this.keys[1].buffer[i] = data.readUInt32LE(i * 4 + 220);
    for (let i = 0; i < 58; i++)
      this.keys[2].buffer[i] = data.readUInt32LE(i * 4 + 448);
  }

  apply(buf) {
    const { keys } = this;
    const size = buf.length;

    const pre = (size < this.changeLen) ? size : this.changeLen;
    if (pre !== 0) {
      for (let i = 0; i < pre; i++) {
        buf[i] ^= this.changeData >>> (8 * (4 - this.changeLen + i));
      }
      this.changeLen -= pre;
    }

    function doRound() {
      const result = keys[0].key & keys[1].key | keys[2].key & (keys[0].key | keys[1].key);
      for (const k of keys) {
        if (result === k.key) {
          const t1 = k.buffer[k.pos1];
          const t2 = k.buffer[k.pos2];
          const t3 = (t1 <= t2 ? t1 : t2);
          k.sum = ((t1 + t2) & 0xFFFFFFFF) >>> 0;
          k.key = +(t3 > k.sum);
          k.pos1 = (k.pos1 + 1) % k.size;
          k.pos2 = (k.pos2 + 1) % k.size;
        }
      }
    }

    for (let i = pre; i < size - 3; i += 4) {
      doRound();
      for (const k of keys) {
        buf[i] ^= k.sum;
        buf[i + 1] ^= k.sum >>> 8;
        buf[i + 2] ^= k.sum >>> 16;
        buf[i + 3] ^= k.sum >>> 24;
      }
    }

    const remain = (size - pre) & 3;
    if (remain !== 0) {
      doRound();

      this.changeData = 0;
      for (const k of keys) {
        this.changeData ^= k.sum;
      }

      for (let i = 0; i < remain; i++) {
        buf[size - remain + i] ^= this.changeData >>> (i * 8);
      }

      this.changeLen = 4 - remain;
    }
  }
}

/* ------- *
 * exports *
 * ------- */
module.exports = TeraCrypto;
