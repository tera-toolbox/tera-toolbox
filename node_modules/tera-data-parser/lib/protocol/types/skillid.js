'use strict'

function parseArgs(obj) {
	if(typeof obj === 'number') obj = {type: 1, id: obj}

	const npc = Boolean(obj.npc),
		type = obj.type & 0xf,
		hasHuntingZone = npc && type === 1

	return {
		reserved: obj.reserved & 0x7fffffff,
		npc,
		type,
		huntingZoneId: hasHuntingZone ? obj.huntingZoneId & 0xfff : 0,
		id: obj.id & (hasHuntingZone ? 0xffff : 0xfffffff)
	}
}

class SkillID {
	constructor(obj) { Object.assign(this, parseArgs(obj)) }

	equals(obj) {
		obj = parseArgs(obj)

		return this.id === obj.id && this.huntingZoneId === obj.huntingZoneId &&
			this.type === obj.type && this.npc === obj.npc && this.reserved === obj.reserved
	}

	clone() { return Object.assign(Object.create(SkillID.prototype), this) }

	toString() {
		let str = this.reserved ? `[X${this.reserved.toString(16)}]` : ''

		switch(this.type) {
			case 1: str += 'A'; break
			case 2: str += 'R'; break
			default: str += `[T${this.type}]`; break
		}

		if(this.npc && this.type === 1) str += `${this.huntingZoneId}:`
		return str + this.id
	}
}

module.exports = SkillID