const path = require('path')
const util = require('util')
const binarySearch = require('binary-search')
const { protocol } = require('tera-data-parser')
const types = Object.values(require('tera-data-parser').types)
const log = require('../../logger')
const ModuleManager = require('./moduleManager')

function* iterateHooks(globalHooks = [], codeHooks = []) {
	const globalHooksIterator = globalHooks[Symbol.iterator](); // .values()
	const codeHooksIterator = codeHooks[Symbol.iterator](); // .values()

	let nextGlobalHook = globalHooksIterator.next()
	let nextCodeHook = codeHooksIterator.next()

	while (!nextGlobalHook.done || !nextCodeHook.done) {
		const globalHookGroup = nextGlobalHook.value
		const codeHookGroup = nextCodeHook.value

		if(globalHookGroup && (!codeHookGroup || globalHookGroup.order <= codeHookGroup.order)) {
			yield* globalHookGroup.hooks
			nextGlobalHook = globalHooksIterator.next()
		} else {
			yield* codeHookGroup.hooks
			nextCodeHook = codeHooksIterator.next()
		}
	}
}

function getHookName(hook) {
	const callbackName = hook.callback ? (hook.callback.name || '(anonymous)') : '<unknown>'
	const moduleName = hook.moduleName || '<unknown>'
	return `${callbackName} in ${moduleName}`
}

function getMessageName(map, identifier, version, originalName) {
	if(typeof identifier === 'string') {
		const append = (identifier !== originalName) ? ` (original: "${originalName}")` : ''
		return `${identifier}<${version}>${append}`
	}

	if(typeof identifier === 'number') {
		const name = map.code.get(identifier) || `(opcode ${identifier})`
		return `${name}<${version}>`
	}

	return '(?)'
}

function parseStack(err) {
	const stack = (err && err.stack) || ''
	return stack.split('\n').slice(1).map((line) => {
		if(line.indexOf('(eval ') !== -1) {
			// throw away eval info
			// see <https://github.com/stacktracejs/error-stack-parser/blob/d9eb56a/error-stack-parser.js#L59>
			line = line.replace(/(\(eval at [^()]*)|(\),.*$)/g, '')
		}

		const match = line.match(/^\s*at (?:.+\s+\()?(?:(.+):\d+:\d+|([^)]+))\)?/)
		return match && {
			filename: match[2] || match[1],
			source: line,
		}
	}).filter(Boolean)
}

function errStack(err = new Error(), removeFront = true) {
	const stack = parseStack(err)
	const libPath = /tera-proxy-game[\\/]lib/

	// remove node internals from end
	while (stack.length > 0 && !path.isAbsolute(stack[stack.length - 1].filename)) {
		stack.pop()
	}

	// remove tera-proxy-game internals from end
	while (stack.length > 0 && libPath.test(stack[stack.length - 1].filename)) {
		stack.pop()
	}

	if(removeFront) {
		// remove tera-proxy-game internals from front
		while (stack.length > 0 && libPath.test(stack[0].filename)) {
			stack.shift()
		}
	}

	return stack.map(frame => frame.source).join('\n')
}

// -----------------------------------------------------------------------------

class Dispatch {
	constructor(connection) {
        this.connection = connection;
        this.proxyAuthor = 'caali';
        this.region = this.connection.info.regionShort;
        this.majorPatchVersion = this.connection.info.majorPatch;
        this.minorPatchVersion = this.connection.info.minorPatch;

		// hooks:
		// { <code>:
		//	 [ { <order>
		//		 , hooks:
		//			 [ { <code>, <filter>, <order>, <definitionVersion>, <moduleName>, <callback> }
		//			 ]
		//		 }
		//	 ]
		// }
		this.hooks = new Map()

        // Initialize sysmsg maps
        this.sysmsgMap = {
            name: new Map(),
            code: new Map(),
        };
        
        Object.keys(this.connection.info.sysmsg).forEach(name => {
            this.sysmsgMap.name.set(name, this.connection.info.sysmsg[name]);
            this.sysmsgMap.code.set(this.connection.info.sysmsg[name], name);
        });

        // Initialize protocol maps
        this.protocol = protocol.createInstance(this.platform)
        this.protocol.load(require.resolve('tera-data'))

        this.latestDefVersion = new Map()
        if (this.protocol.messages) {
            for (const [name, defs] of this.protocol.messages) {
                this.latestDefVersion.set(name, Math.max(...defs.keys()))
            }
        }

        this.protocolVersion = this.connection.info.protocol;
        this.protocolMap = this.protocol.maps.get(this.protocolVersion);

        if (!this.protocolMap) {
            log.error(`[dispatch] Unmapped protocol version ${this.protocolVersion} (${this.region.toUpperCase()} v${this.majorPatchVersion}.${this.minorPatchVersion}).`);
            log.error('[dispatch] This can be caused by either of the following:');
            log.error('[dispatch] 1) You are trying to play using a newly released client version that is not yet supported.');
            log.error('[dispatch]    If there was a game maintenance within the past few hours, please report this!');
            log.error('[dispatch]    Otherwise, your client might have been updated for an upcoming patch too early.');
            log.error('[dispatch] 2) You are trying to play using an outdated client version.');
            log.error('[dispatch]    Try a client repair or reinstalling the game from scratch to fix this!');
            if (this.region === 'na')
                log.error('[dispatch]   (Both issues occur frequently on NA due to EME\'s shitty patch distribution system.)');
            log.error(`[dispatch] If you cannot fix this on your own, ask for help here: ${global.TeraProxy.SupportUrl}!`);
        } else {
            log.info(`[dispatch] Switching to protocol version ${this.protocolVersion} (${this.region.toUpperCase()} v${this.majorPatchVersion}.${this.minorPatchVersion})`);
        }

        // Create mod manager
        this.moduleManager = new ModuleManager(this, this.connection.moduleFolder);
	}

    destructor() {
        this.reset();
        this.moduleManager.destructor();
        this.moduleManager = null;
    }

	reset() {
        this.moduleManager.unloadAll();
		this.hooks.clear()
	}

    checkDefinitions(defs) {
        let missingDefs = [];

        Object.entries(defs).forEach(([name, versions]) => {
            if (typeof versions !== 'object')
                versions = [versions];

            const known_versions = this.protocol.messages.get(name);
            versions.forEach(v => {
                if(v !== 'raw' && (!known_versions || !known_versions.get(v)))
                    missingDefs.push({'name': name, 'version': v});
            });
        });

        return missingDefs;
    }

    isConsole() {
        return this.platform === 'console';
	}

    isClassic() {
        return this.platform === 'classic';
    }

    get platform() {
        return this.connection.info.platform;
    }

	parseSystemMessage(message) {
		if(message[0] !== '@') throw Error(`Invalid system message "${message}" (expected @)`)

		const tokens = message.split('\v'),
			id = tokens[0].substring(1),
			name = id.includes(':') ? id : this.sysmsgMap.code.get(parseInt(id))

		if(!name) throw Error(`Unmapped system message ${id} ("${message}")`)

		const data = {}

		for(let i = 2; i < tokens.length; i += 2) data[tokens[i - 1]] = tokens[i]

		return {id: name, tokens: data}
	}

	buildSystemMessage(message, data) {
		if(typeof message === 'string') message = {id: message, tokens: data}
		else {
			const type = message === null ? 'null' : typeof message

			if(type !== 'object') throw TypeError(`Expected object or string, got ${type}`)
			if(!message.id) throw Error('message.id is required')
		}

		const id = message.id.toString().includes(':') ? message.id : this.sysmsgMap.name.get(message.id)

		if(!id) throw Error(`Unknown system message "${message.id}"`)

		data = message.tokens

		let str = '@' + id

		for(let key in data) str += `\v${key}\v${data[key]}`

		return str
	}

	createHook(base, name, version, opts, cb) {
		// parse args
		if(typeof version !== 'number' && version !== '*' && version !== 'raw')
            throw TypeError(`[dispatch] hook: invalid version specified (${version})`)

		if(opts && typeof opts !== 'object') {
			cb = opts
			opts = {}
		}

		if(typeof cb !== 'function')
            throw TypeError(`[dispatch] hook: last argument not a function (given: ${typeof cb})`)

		// retrieve opcode
		let code
		if(name === '*') {
			code = name
			if(typeof version === 'number')
                throw TypeError(`[dispatch] hook: * hook must request version '*' or 'raw' (given: ${version})`)
		} else {
			// Check if opcode is mapped
			code = this.protocolMap.name.get(name)
            if(code == null)
                throw Error(`[dispatch] hook: unmapped packet "${name}"`)

			// Check if definition exists
            if(version !== 'raw') {
                let def = this.protocol.messages.get(name)
                if (def)
                    def = def.get(version)
                if (!def)
                {
                    if(this.latestDefVersion.get(name) > version)
                        throw Error(`[dispatch] hook: obsolete defintion (${name}.${version})`)
                    else
                        throw Error(`[dispatch] hook: definition not found (${name}.${version})`)
                }
            }
		}

		// check version
		if(typeof version !== 'number') {
			if(version === 'latest') version = '*'
			if(version !== '*' && version !== 'raw') {
				// TODO warning
				version = '*'
			}
		}

		// check filters
		const filter = Object.assign({
			fake: false,
			incoming: null,
			modified: null,
			silenced: false,
		}, opts.filter)

		return Object.assign(base, {
			code,
			filter,
			order: opts.order || 0,
			definitionVersion: version,
			callback: cb,
			name: name || "",
		})
	}

	addHook(hook) {
		const { code, order } = hook

		if(!this.hooks.has(code)) {
			this.hooks.set(code, [])
		}

		const ordering = this.hooks.get(code)
		const index = binarySearch(ordering, { order }, (a, b) => a.order - b.order)
		if(index < 0) {
			// eslint-disable-next-line no-bitwise
			ordering.splice(~index, 0, { order, hooks: [hook] })
		} else {
			ordering[index].hooks.push(hook)
		}
	}

	hook(...args) {
		const hook = this.createHook({}, ...args)
		this.addHook(hook)
		return hook
	}

	unhook(hook) {
        if(!hook)
            return;

		if(!this.hooks.has(hook.code)) return

		const ordering = this.hooks.get(hook.code)
		const group = ordering.find(o => o.order === hook.order)
		if(group) group.hooks = group.hooks.filter(h => h !== hook)
	}

    unhookModule(name) {
        for(const orderings of this.hooks.values()) {
            for(const ordering of orderings)
                ordering.hooks = ordering.hooks.filter(hook => hook.moduleName !== name)
        }
    }

	write(outgoing, name, version, data) {
		if(!this.connection)
            return false

		if(Buffer.isBuffer(name)) {
			data = Buffer.from(name)
		} else {
			if(typeof version !== 'number' && typeof version !== 'string')
				throw new Error(`[dispatch] write: version is required`)

			if(version !== '*') {
				const latest = this.latestDefVersion.get(name)
				if(latest && version < latest) {
					log.debug([
						`[dispatch] write: ${getMessageName(this.protocolMap, name, version, name)} is not latest version (${latest})`,
						errStack(),
					].join('\n'))
				}
			}

			try {
				data = this.protocol.write(this.protocolVersion, name, version, data, null, null, null)
			} catch (e) {
                throw new Error(`[dispatch] write: failed to generate ${getMessageName(this.protocolMap, name, version, name)}:\n${e}`);
			}
		}

		data = this.handle(data, !outgoing, true)
		if(data === false)
            return false

		this.connection[outgoing ? 'sendServer' : 'sendClient'](data)
		return true
	}

	handle(data, incoming, fake = false) {
		const code = data.readUInt16LE(2)
		const copy = Buffer.from(data)

		const globalHooks = this.hooks.get('*')
		const codeHooks = this.hooks.get(code)
		if(!globalHooks && !codeHooks) return data

		const { protocolVersion } = this
		let modified = false
		let silenced = false

		function bufferAttachFlags(buf) {
			Object.defineProperties(buf, {
				$fake: { get: () => fake },
				$incoming: { get: () => incoming },
				$modified: { get: () => modified },
				$silenced: { get: () => silenced },
			})
		}

		function objectAttachFlags(obj) {
			Object.defineProperties(obj, {
				$fake: { value: fake },
				$incoming: { value: incoming },
				$modified: { value: modified },
				$silenced: { value: silenced },
			})
		}

		bufferAttachFlags(data)

		let eventCache = [],
			iter = 0,
			hooks = (globalHooks ? globalHooks.size : 0) + (codeHooks ? codeHooks.size : 0)

		for(const hook of iterateHooks(globalHooks, codeHooks)) {
			// check flags
			const { filter } = hook
			if(filter.fake != null && filter.fake !== fake) continue
			if(filter.incoming != null && filter.incoming !== incoming) continue
			if(filter.modified != null && filter.modified !== modified) continue
			if(filter.silenced != null && filter.silenced !== silenced) continue

			const lastHook = ++iter === hooks

			if(hook.definitionVersion === 'raw')
				try {
					const result = hook.callback(code, data, incoming, fake)

					if(Buffer.isBuffer(result) && result !== data) {
						modified = modified || (result.length !== data.length) || !result.equals(data)
						bufferAttachFlags(result)
						data = result
					} else {
						modified = modified || !data.equals(copy)
						if(typeof result === 'boolean') silenced = !result
					}
				}
				catch(e) {
					log.error([
						`[dispatch] handle: error running raw hook for ${getMessageName(this.protocolMap, code, hook.definitionVersion)}`,
						`hook: ${getHookName(hook)}`,
						`data: ${data.toString('hex')}`,
						`error: ${e.message}`,
						errStack(e),
					].join('\n'))
					continue
				}
			else { // normal hook
				try {
					const defVersion = hook.definitionVersion

					let event = eventCache[defVersion] || (eventCache[defVersion] = this.protocol.parse(protocolVersion, code, defVersion, data, null))

					objectAttachFlags(lastHook ? event : (event = deepClone(event)))

					try {
						const result = hook.callback(event, fake)

						if(result === true) {
							modified = true
							silenced = false

							try {
								data = this.protocol.write(protocolVersion, code, defVersion, event, null, null, null)
								bufferAttachFlags(data)

								eventCache = []
							} catch (e) {
								log.error([
									`[dispatch] handle: failed to generate ${getMessageName(this.protocolMap, code, defVersion)}`,
									`hook: ${getHookName(hook)}`,
									`error: ${e.message}`,
									errStack(e, false),
								].join('\n'))
							}
						}
						else if(result === false) silenced = true
					}
					catch(e) {
						log.error([
							`[dispatch] handle: error running hook for ${getMessageName(this.protocolMap, code, defVersion)}`,
							`hook: ${getHookName(hook)}`,
							`data: ${util.inspect(event)}`,
							`error: ${e.message}`,
							errStack(e),
						].join('\n'))
					}
				}
				catch(e) {
					log.error([
						`[dispatch] handle: failed to parse ${getMessageName(this.protocolMap, code, hook.definitionVersion)}`,
						`hook: ${getHookName(hook)}`,
						`data: ${data.toString('hex')}`,
						`error: ${e.message}`,
						errStack(e, false),
					].join('\n'))
				}
			}
		}

		// return value
		return (!silenced ? data : false)
	}
}

function deepClone(obj) {
	if(obj instanceof Buffer) return new Buffer.from(obj)

	for(let t of types) // Custom parser types
		if(obj instanceof t) return Object.assign(Object.create(t.prototype), obj)

	let copy = Array.isArray(obj) ? [] : {}

	for(let key in obj) {
		let val = obj[key]

		if(typeof val === 'object') copy[key] = deepClone(val)
		else copy[key] = val
	}

	return copy
}

module.exports = Dispatch
