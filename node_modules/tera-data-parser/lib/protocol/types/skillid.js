'use strict'

function parseArgs(obj) {
    if (typeof obj === 'number')
        obj = { type: 1, id: obj };
    else if (obj == null)
        obj = {};

    const npc = Boolean(obj.npc),
        type = obj.type & 0xf,
        hasHuntingZone = npc && type === 1;

    return {
        reserved: obj.reserved & 0x7fffffff,
        npc,
        type,
        huntingZoneId: hasHuntingZone ? obj.huntingZoneId & 0xfff : 0,
        id: obj.id & (hasHuntingZone ? 0xffff : 0xfffffff)
    };
}

class SkillID {
    constructor(obj) {
        Object.assign(this, parseArgs(obj));
    }

    equals(obj) {
        obj = parseArgs(obj);
        return this.id === obj.id && this.huntingZoneId === obj.huntingZoneId && this.type === obj.type && this.npc === obj.npc && this.reserved === obj.reserved;
    }

    clone() {
        return Object.assign(Object.create(SkillID.prototype), this);
    }

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

    static fromUint32(raw) {
        const type = (raw >> 26) & 0xf,
            npc = Boolean(raw & 0x40000000),
            hasHuntingZone = npc && type === 1;

        return new SkillID({
            id: raw & (hasHuntingZone ? 0xffff : 0x3ffffff),
            huntingZoneId: hasHuntingZone ? ((raw >> 16) & 0x3ff) : 0,
            type,
            npc,
            reserved: raw >> 31
        });
    }

    toUint32() {
        const hasHuntingZone = this.npc && this.type === 1;

        let raw = (this.id || 0) & (hasHuntingZone ? 0xffff : 0x3ffffff);
        if (hasHuntingZone)
            raw |= (this.huntingZoneId & 0x3ff) << 16;
        raw |= (this.type & 0xf) << 26;
        raw |= (this.npc & 1) << 30;
        raw |= (this.reserved & 1) << 31;

        return raw;
    }

    static fromUint64(raw) {
        const type = Number((raw >> 28n) & 0xfn),
            npc = Boolean(raw & 0x0100000000n),
            hasHuntingZone = npc && type === 1;

        return new SkillID({
            id: Number(raw & (hasHuntingZone ? 0xffffn : 0xfffffffn)),
            huntingZoneId: hasHuntingZone ? Number((raw >> 16n) & 0xfffn) : 0,
            type,
            npc,
            reserved: Number(raw >> 33n)
        });
    }

    toUint64() {
        const hasHuntingZone = this.npc && this.type === 1;

        let raw = BigInt((this.id || 0) & (hasHuntingZone ? 0xffff : 0xfffffff));
        if (hasHuntingZone)
            raw |= BigInt(this.huntingZoneId & 0xfff) << 16n;
        raw |= BigInt(this.type & 0xf) << 28n
        raw |= BigInt(this.npc & 1) << 32n
        raw |= BigInt(this.reserved & 1) << 33n

        return raw;
    }
}

module.exports = SkillID;
