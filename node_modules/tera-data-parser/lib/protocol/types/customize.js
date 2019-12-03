'use strict'

class Customize {
	constructor(data = 0n) {
		if(typeof data === 'bigint')
			Object.assign(this, {
				unk:		Number(data & 0xffn),
				skinColor:	Number(data >> 8n & 0xffn),
				faceStyle:	Number(data >> 16n & 0xffn),
				faceDecal:	Number(data >> 24n & 0xffn),
				hairStyle:	Number(data >> 32n & 0xffn),
				hairColor:	Number(data >> 40n & 0xffn),
				voice:		Number(data >> 48n & 0xffn),
				tattoos:	Number(data >> 56n & 0xffn)
			});
		else
			Object.assign(this, {
				unk:		Number(data.unk)		|| 0,
				skinColor:	Number(data.skinColor)	|| 0,
				faceStyle:	Number(data.faceStyle)	|| 0,
				faceDecal:	Number(data.faceDecal)	|| 0,
				hairStyle:	Number(data.hairStyle)	|| 0,
				hairColor:	Number(data.hairColor)	|| 0,
				voice:		Number(data.voice)		|| 0,
				tattoos:	Number(data.tattoos)	|| 0
			});
	}

    toUint64() {
        return BigInt(this.unk & 0xff)
            | (BigInt(this.skinColor & 0xff) << 8n)
            | (BigInt(this.faceStyle & 0xff) << 16n)
            | (BigInt(this.faceDecal & 0xff) << 24n)
            | (BigInt(this.hairStyle & 0xff) << 32n)
            | (BigInt(this.hairColor & 0xff) << 40n)
            | (BigInt(this.voice & 0xff) << 48n)
            | (BigInt(this.tattoos & 0xff) << 56n);
    }
}

module.exports = Customize;
