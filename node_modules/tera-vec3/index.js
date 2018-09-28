'use strict'

const { isArray } = Array,
	{ abs, atan2, round, sqrt, cos, sin } = Math

// Usage: num(number, default)
function num(n, d) {
	return n !== undefined ? Number(n) : d
}

// Usage: parseArgs.apply(default, arguments)
function parseArgs(x, y, z) {
	if(typeof x === 'object' && x !== null)
		if(isArray(x))
			return { x: num(x[0], this), y: num(x[1], this), z: num(x[2], this) }
		else
			return { x: num(x.x, this), y: num(x.y, this), z: num(x.z, this) }

	return { x: num(x, this), y: num(y, this), z: num(z, this) }
}

class Vec3 {
	constructor() {
		Object.assign(this, parseArgs.apply(0, arguments))
	}

	add() {
		const { x, y, z } = parseArgs.apply(0, arguments)

		this.x += x
		this.y += y
		this.z += z
		return this
	}

	sub() {
		const { x, y, z } = parseArgs.apply(0, arguments)

		this.x -= x
		this.y -= y
		this.z -= z
		return this
	}

	mult() {
		const { x, y, z } = parseArgs.apply(1, arguments)

		this.x *= x
		this.y *= y
		this.z *= z
		return this
	}

	div() {
		const { x, y, z } = parseArgs.apply(1, arguments)

		this.x /= x
		this.y /= y
		this.z /= z
		return this
	}

	scale(m) {
		m = Number(m) || 0

		this.x *= m
		this.y *= m
		this.z *= m
		return this
	}

	rotate(r) {
		const x = this.x,
			y = this.y,
			c = cos(r),
			s = sin(r)

		this.x = x*c - y*s
		this.y = x*s + y*c
		return this
	}

	normalize() {
		const div = 1 / sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
		this.x *= div
		this.y *= div
		this.z *= div
		return this
	}

	abs() {
		this.x = abs(this.x)
		this.y = abs(this.y)
		this.z = abs(this.z)
		return this
	}

	round() {
		this.x = round(this.x)
		this.y = round(this.y)
		this.z = round(this.z)
		return this
	}

	addN() {
		const { x, y, z } = parseArgs.apply(0, arguments)

		return new Vec3(this.x + x, this.y + y, this.z + z)
	}

	subN() {
		const { x, y, z } = parseArgs.apply(0, arguments)

		return new Vec3(this.x - x, this.y - y, this.z - z)
	}

	multN() {
		const { x, y, z } = parseArgs.apply(1, arguments)

		return new Vec3(this.x * x, this.y * y, this.z * z)
	}

	divN() {
		const { x, y, z } = parseArgs.apply(1, arguments)

		return new Vec3(this.x / x, this.y / y, this.z / z)
	}

	scaleN(m) {
		m = Number(m) || 0

		return new Vec3(this.x * m, this.y * m, this.z * m)
	}

	rotateN(r) {
		const x = this.x,
			y = this.y,
			c = cos(r),
			s = sin(r)

		return new Vec3(x*c - y*s, x*s + y*c, this.z)
	}

	normalizeN() {
		const div = 1 / sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
		return new Vec3(this.x * div, this.y * div, this.z * div)
	}

	absN() {
		return new Vec3(abs(this.x), abs(this.y), abs(this.z))
	}

	roundN() {
		return new Vec3(round(this.x), round(this.y), round(this.z))
	}

	length() {
		return sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
	}

	sqrLength() {
		return this.x*this.x + this.y*this.y + this.z*this.z
	}

	dist2D() {
		let { x, y } = parseArgs.apply(0, arguments)

		x -= this.x
		y -= this.y

		return sqrt(x*x + y*y)
	}

	sqrDist2D() {
		let { x, y } = parseArgs.apply(0, arguments)

		x -= this.x
		y -= this.y

		return x*x + y*y
	}

	dist3D() {
		let { x, y, z } = parseArgs.apply(0, arguments)

		x -= this.x
		y -= this.y
		z -= this.z

		return sqrt(x*x + y*y + z*z)
	}

	sqrDist3D() {
		let { x, y, z } = parseArgs.apply(0, arguments)

		x -= this.x
		y -= this.y
		z -= this.z

		return x*x + y*y + z*z
	}

	angleTo() {
		const { x, y } = parseArgs.apply(0, arguments)

		return atan2(y - this.y, x - this.x)
	}

	isNaN() {
		return isNaN(this.x) || isNaN(this.y) || isNaN(this.z)
	}

	equals() {
		const { x, y, z } = parseArgs.apply(0, arguments)

		return this.x === x && this.y === y && this.z === z
	}

	clone() {
		return Object.assign(Object.create(Vec3.prototype), this)
	}

	toString() {
		return `${this.x},${this.y},${this.z}`
	}
}

module.exports = Vec3