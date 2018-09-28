'use strict'

const Long = require('long'),
	  log = require('../logger'),
      { SkillID, Vec3 } = require('./types')

const MULT_INT16_TO_RAD = 1 / 0x8000 * Math.PI,
	  MULT_RAD_TO_INT16 = 1 / Math.PI * 0x8000

class Readable {
	constructor(buffer, position = 0) {
		this.buffer = buffer
		this.position = position
	}

	seek(n) { return this.position = n }
	skip(n) { return this.position += n }

	bool() {
		const ret = this.byte()
		if(ret > 1) log.warn(new Error('read byte not 0 or 1 for bool'))
		return !!ret
	}

	byte() { return this.buffer.readUInt8(this.position++) }

	bytes(n) { return Buffer.from(this.buffer.slice(this.position, this.position += n)) }

	uint16() {
		const ret = this.buffer.readUInt16LE(this.position)
		this.position += 2
		return ret
	}

	uint32() {
		const ret = this.buffer.readUInt32LE(this.position)
		this.position += 4
		return ret
	}

	uint64() {
		return new Long(this.int32(), this.int32(), true)
	}

	int16() {
		const ret = this.buffer.readInt16LE(this.position)
		this.position += 2
		return ret
	}

	int32() {
		const ret = this.buffer.readInt32LE(this.position)
		this.position += 4
		return ret
	}

	int64() {
		return new Long(this.int32(), this.int32(), false)
	}

	vec3() {
		return new Vec3(this.float(), this.float(), this.float())
	}

	vec3fa() {
		return new Vec3(this.float() * MULT_INT16_TO_RAD, this.float() * MULT_INT16_TO_RAD, this.float() * MULT_INT16_TO_RAD)
	}

	angle() {
		return this.int16() * MULT_INT16_TO_RAD
	}

	skillid32() {
		const raw = this.uint32(),
			type = raw >> 26 & 0xf,
			npc = Boolean(raw & 0x40000000),
			hasHuntingZone = npc && type === 1

		return new SkillID({
			id: raw & (hasHuntingZone ? 0xffff : 0x3ffffff),
			huntingZoneId: hasHuntingZone ? raw >> 16 & 0x3ff : 0,
			type,
			npc,
			reserved: raw >> 31
		})
	}

	skillid() {
		const raw = this.uint64(),
			type = raw.shr(28).and(0xf).toNumber(),
			npc = !raw.shr(32).and(1).isZero(),
			hasHuntingZone = npc && type === 1

		return new SkillID({
			id: raw.and(hasHuntingZone ? 0xffff : 0xfffffff).toNumber(),
			huntingZoneId: hasHuntingZone ? raw.shr(16).and(0xfff).toNumber() : 0,
			type,
			npc,
			reserved: raw.shr(33).and(1).toNumber()
		})
	}

	float() {
		const ret = this.buffer.readFloatLE(this.position)
		this.position += 4
		return ret
	}

	double() {
		const ret = this.buffer.readDoubleLE(this.position)
		this.position += 8
		return ret
	}

	string() {
		const ret = []
		let c, i = -1
		while(c = this.uint16()) ret[++i] = c
		return String.fromCharCode.apply(null, ret)
	}
}

class Writeable {
	constructor(length) {
		this.length = length
		this.buffer = Buffer.alloc(this.length)
		this.position = 0
	}

	seek(n) { this.position = n }
	skip(n) { this.position += n }

	bool(b) { this.buffer[this.position++] = !!b }
	byte(n) { this.buffer[this.position++] = n }
	bytes(buf) {
		if(buf) {
			buf.copy(this.buffer, this.position)
			this.position += buf.length
		}
	}
	uint16(n = 0) { this.position = this.buffer.writeUInt16LE(n & 0xffff, this.position) }
	uint32(n = 0) { this.position = this.buffer.writeUInt32LE(n >>> 0, this.position) }
	uint64(obj = {}) {
		if(typeof obj === 'number') {
			if(!Number.isSafeInteger(obj)) log.warn(new Error('unsafe integer was provided'))
			obj = Long.fromNumber(obj, false)
		}
		this.uint32(obj.low)
		this.uint32(obj.high)
	}
	vec3(v = {}) {
		this.float(v.x)
		this.float(v.y)
		this.float(v.z)
	}
	vec3fa(v = {}) {
		this.float(Math.round(v.x * MULT_RAD_TO_INT16 % 0x10000))
		this.float(Math.round(v.y * MULT_RAD_TO_INT16 % 0x10000))
		this.float(Math.round(v.z * MULT_RAD_TO_INT16 % 0x10000))
	}
	angle(r = 0) { this.int16(Math.round(r * MULT_RAD_TO_INT16)) }

	skillid32(obj = {}) {
        if(typeof obj === 'number') obj = {type: 1, id: obj}

		const hasHuntingZone = Boolean(obj.npc) && obj.type == 1

		let raw = (Number(obj.id) || 0) & (hasHuntingZone ? 0xffff : 0x3ffffff)
		if(hasHuntingZone) raw |= (obj.huntingZoneId & 0x3ff) << 16
		raw |= (obj.type & 0xf) << 26
		raw |= (obj.npc & 1) << 30
		raw |= (obj.reserved & 1) << 31

		this.uint32(raw)
	}

	skillid(obj = {}) {
        if(typeof obj === 'number') obj = {type: 1, id: obj}

		const hasHuntingZone = Boolean(obj.npc) && obj.type == 1

		let raw = Long.fromNumber((Number(obj.id) || 0) & (hasHuntingZone ? 0xffff : 0xfffffff), true)
		if(hasHuntingZone) raw = raw.or(Long.fromNumber(obj.huntingZoneId & 0xfff, true).shl(16))
		raw = raw.or(Long.fromNumber(obj.type & 0xf, true).shl(28))
		raw = raw.or(Long.fromNumber(obj.npc & 1, true).shl(32))
		raw = raw.or(Long.fromNumber(obj.reserved & 1, true).shl(33))

		this.uint64(raw)
	}

	float(n = 0) { this.position = this.buffer.writeFloatLE(n, this.position) }
	double(n = 0) { this.position = this.buffer.writeDoubleLE(n, this.position) }
	string(str = '') { this.buffer.fill(str + '\0', this.position, this.position += (str.length + 1) * 2, 'ucs2') }
}

Object.assign(Writeable.prototype, {
	int16: Writeable.prototype.uint16,
	int32: Writeable.prototype.uint32,
	int64: Writeable.prototype.uint64
})

module.exports = {
	Readable,
	Writeable
}