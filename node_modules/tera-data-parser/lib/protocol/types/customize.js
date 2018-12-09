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

	write(s) {
		s.byte(Number(this.unk));
		s.byte(Number(this.skinColor));
		s.byte(Number(this.faceStyle));
		s.byte(Number(this.faceDecal));
		s.byte(Number(this.hairStyle));
		s.byte(Number(this.hairColor));
		s.byte(Number(this.voice));
		s.byte(Number(this.tattoos));
	}
}

module.exports = Customize;
