'use strict'

// requires
const fs = require('fs');
const path = require('path');
const util = require('util');

const log = require('../logger');
const Stream = require('./stream');
const defParser = require('../parsers/def');
const mapParser = require('../parsers/map');

// constants
const PATH_MAPS = 'map';
const PATH_MAPS_BASE = 'map_base';
const PATH_DEFS = 'protocol';
const PLATFORMS = ['pc', 'console', 'classic'];

class TeraProtocol {
  constructor(platform = 'pc') {
    if (!PLATFORMS.includes(platform))
      throw new Error('Invalid platform!');

    this.platform = platform;
    this.maps = new Map();
    this.messages = new Map();

    this.loaded = false;
  }

  // helper functions
  /**
   * Given an identifier, retrieve the name, opcode, and definition object.
   * @private
   * @param {Number} protocolVersion
   * @param {String|Number|Object} identifier
   * @param {Number} [definitionVersion]
   * @param {String} [defaultName] Default name to return if `identifier` is an
   * object, since no lookups will be performed.
   * @returns Object An object with the `definition` property set, plus a `name`
   * and `code` if either a name or an opcode was passed in as the identifier.
   * @throws {TypeError} `identifier` must be one of the listed types.
   * @throws Errors if supplied an opcode that could not be mapped to a `name`.
   * @throws Errors if a `definition` cannot be found.
   */
  resolveIdentifier(protocolVersion, identifier, definitionVersion = '*', defaultName = '<Object>') {
    const { maps, messages, loaded } = this;
    let name;
    let code;
    let version;
    let definition;
    let latest_version;

    // lazy load
    if (!loaded) this.load();

    if (Array.isArray(identifier)) {
      name = defaultName;
      code = null;
      version = '?';
      definition = identifier;
      latest_version = null;
    } else {
      const map = maps.get(protocolVersion);
      if (!map) {
        throw new Error(`no mapping for protocol version ${protocolVersion}`);
      }

      switch (typeof identifier) {
        case 'string': {
          name = identifier;
          if (map.name.has(name)) {
            code = map.name.get(name);
          } else {
            log.warn(new Error(`code not known for message "${name}"`));
            code = null;
          }
          break;
        }

        case 'number': {
          code = identifier;
          if (map.code.has(code)) {
            name = map.code.get(code);
          } else {
            throw new Error(`mapping not found for opcode ${code}`);
          }
          break;
        }

        default: {
          throw new TypeError('identifier must be a string or number');
        }
      }

      const versions = messages.get(name);
      if (versions) {
        latest_version = Math.max(...versions.keys());

        version = (definitionVersion === '*')
          ? latest_version
          : definitionVersion;

        definition = versions.get(version);
      }
    }

    if (!definition) {
      if (latest_version && version < latest_version)
        throw new Error(`version ${version} of message (name: "${name}", code: ${code}) is outdated and cannot be used anymore`);
      else
        throw new Error(`no definition found for message (name: "${name}", code: ${code}, version: ${version})`);
    }

    return { name, code, version, definition };
  }

  /**
   * Given a definition object and a data object, efficiently compute the byte
   * length for the resulting data buffer.
   * @private
   * @param {Object} definition
   * @param {Object} data
   * @returns {Number}
   * @throws Errors if a type specified in the `definition` is not recognized.
   */
  getLength(definition, data = {}) {
    const SIZES = {
      bool: 1,
      byte: 1,

      int16: 2,
      uint16: 2,
      count: 2,
      offset: 2,

      int32: 4,
      uint32: 4,
      float: 4,

      int64: 8,
      uint64: 8,
      double: 8,

      vec3: 12,
      vec3fa: 12,
      angle: 2,

      skillid32: 4,
      skillid: 8
    };

    let length = 0;

    for (const [key, type] of definition) {
      const val = data[key];
      if (Array.isArray(type)) {
        switch (type.type) {
          case 'array': {
            if (Array.isArray(val)) {
              for (const elem of val) {
                // here + next offsets + recursive length
                length += 4 + this.getLength(type, elem);
              }
            }
            break;
          }

          case 'object': {
            length += this.getLength(type, val);
            break;
          }

          default: {
            // TODO warn/throw?
            break;
          }
        }
      } else {
        switch (type) {
          case 'bytes': {
            if (val) length += val.length;
            break;
          }

          case 'string': {
            // utf+16 + null byte
            length += ((val || '').length + 1) * 2;
            break;
          }

          default: {
            const size = SIZES[type];
            if (size) {
              length += size;
            } else {
              throw new Error(`unknown type: ${type}`);
            }
            break;
          }
        }
      }
    }

    return length;
  }

  // public methods
  /**
   * Loads (or reloads) the opcode mapping and message definitions.
   * @param {String} [basePath] Path to the base package.json.
   */
  load(basePath = require.resolve('tera-data')) {
    const { maps, messages, platform } = this;

    if (path.basename(basePath) === 'package.json') {
      basePath = path.dirname(basePath);
    }

    const mappedMessages = new Set();

    // reset maps and messages
    maps.clear();
    messages.clear();

    // read map
    const mapPath = path.join(basePath, PATH_MAPS);
    const mapFiles = fs.readdirSync(mapPath);
    for (const file of mapFiles) {
      const fullpath = path.join(mapPath, file);

      const parsedName = path.basename(file).match(/^protocol.(\d+)\.map$/);
      if (!parsedName) {
        if (file.startsWith('protocol.') && file.endsWith('.map')) {
          log.warn(`[protocol] load (map) - invalid filename syntax "${fullpath}"`);
        } else {
          log.debug(`[protocol] load (map) - skipping path "${fullpath}"`);
        }
        continue;
      }

      const version = parseInt(parsedName[1], 10);
      const mapping = mapParser(fullpath);
      if (!mapping) continue;

      maps.set(version, mapping);

      for (const name of mapping.name.keys()) {
        mappedMessages.add(name);
      }
    }

    // read base map
    const mapPathBase = path.join(basePath, PATH_MAPS_BASE);
    const mapFilesBase = fs.readdirSync(mapPathBase);
    for (const file of mapFilesBase) {
      const fullpath = path.join(mapPathBase, file);

      const parsedName = path.basename(file).match(/^protocol.(\d+)\.map$/);
      if (!parsedName) {
        if (file.startsWith('protocol.') && file.endsWith('.map')) {
          log.warn(`[protocol] load (map) - invalid filename syntax "${fullpath}"`);
        } else {
          log.debug(`[protocol] load (map) - skipping path "${fullpath}"`);
        }
        continue;
      }

      const version = parseInt(parsedName[1], 10);
      const mapping = mapParser(fullpath);
      if (!mapping) continue;

      let map = maps.get(version);
      if(map) {
        mapping.name.forEach((value, key, _) => { map.name.set(key, value); });
        mapping.code.forEach((value, key, _) => { map.code.set(key, value); });
      }else {
        maps.set(version, mapping);
      }

      for (const name of mapping.name.keys()) {
        mappedMessages.add(name);
      }
    }

    // read protocol directory (common)
    const defPath = path.join(basePath, PATH_DEFS);
    const defFiles = fs.readdirSync(defPath);
    for (const file of defFiles) {
      const fullpath = path.join(defPath, file);

      const parsedName = path.basename(file).match(/^(\w+)\.(\d+)(\.(\w+))?\.def$/);
      if (!parsedName) {
        if (file.endsWith('.def')) {
          log.warn(`[protocol] load (def) - invalid filename syntax "${fullpath}"`);
        } else {
          log.debug(`[protocol] load (def) - skipping path "${fullpath}"`);
        }
        continue;
      }

      const name = parsedName[1];
      const version = parseInt(parsedName[2], 10);
      const def_platform = parsedName[4];

      const definition = defParser(fullpath);
      if (!definition) continue;

      if(!def_platform || def_platform === platform) {
        if (!messages.has(name))
          messages.set(name, new Map());

        // Always prefer platform-specific definition over default one!
        if (def_platform || !messages.get(name).get(version))
          messages.get(name).set(version, definition);
      }

      if (!mappedMessages.has(name)) {
        log.warn(`[protocol] load - unmapped message "${name}"`);
      }
    }

    this.loaded = true;
    return true;
  }

  /**
   * @param {Number} protocolVersion
   * @param {String|Number|Object} identifier
   * @param {Number} [definitionVersion]
   * @param {Buffer|Stream.Readable} [reader]
   * @param {String} [customName]
   * @returns {Object}
   */
  parse(protocolVersion, identifier, definitionVersion, reader, customName) {
    // parse params
    if (Buffer.isBuffer(definitionVersion)) {
      reader = definitionVersion;
      definitionVersion = '*';
    }

    const { name, version, definition } =
      this.resolveIdentifier(protocolVersion, identifier, definitionVersion, customName);
    const displayName = (version !== '?') ? `${name}<${version}>` : name;

    // convert `reader` to a stream
    if (Buffer.isBuffer(reader)) {
      reader = new Stream.Readable(reader, 4);
    }

    // begin parsing
    const count = new Map();
    const offset = new Map();

    const parseField = ([key, type], data, keyPathBase = '') => {
      const keyPath = (keyPathBase !== '') ? `${keyPathBase}.${key}` : key;

      if (Array.isArray(type)) {
        if (type.type === 'object') {
          data[key] = {};
          for (const f of type) {
            parseField(f, data[key], keyPath);
          }
          return;
        }

        // handle array type
        const length = count.get(keyPath);
        const array = new Array(length);
        let index = 0;
        let next = offset.get(keyPath);

        while (next && index < length) {
          let pos = reader.position;
          if (pos !== next) {
            log.warn(`[protocol] parse - ${displayName}: offset mismatch for array "${keyPath}" at ${reader.position} (expected ${next})`);
            reader.seek(next);
            pos = next;
          }

          const here = reader.uint16();
          if (pos !== here) {
            throw new Error(`${displayName}.${keyPath}: cannot find next element of array at ${pos} (found value ${here})`);
          }

          next = reader.uint16();
          array[index++] = this.parse(null, type, null, reader, `${displayName}.${keyPath}`);

          if (next && index === length) {
            throw new Error(`${displayName}.${keyPath}: found out of bounds element ${index} (expected length ${length})`);
          }
        }

        if (index !== length) {
          throw new Error(`${displayName}.${keyPath}: array length mismatch, found ${index} (expected ${length})`);
        }

        data[key] = array;
      } else {
        // handle primitive type
        switch (type) {
          case 'count': {
            count.set(keyPath, reader.uint16());
            break;
          }

          case 'offset': {
            offset.set(keyPath, reader.uint16());
            break;
          }

          default: {
          	let cnt = count.get(keyPath);
            if (offset.has(keyPath)) {
              const ofs = offset.get(keyPath);
              if ((type !== 'bytes' || cnt > 0) && ofs < (2 + offset.size + count.size) * 2) { // check if offset lies within header
                throw new Error(`${displayName}.${keyPath}: invalid offset for "${keyPath}" at ${reader.position} (inside header)`);
              }
              if (reader.position !== ofs) {
                log.warn(`[protocol] parse - ${displayName}: offset mismatch for "${keyPath}" at ${reader.position} (expected ${ofs})`);
                reader.seek(ofs);
              }
            }

            data[key] = reader[type](cnt);
            break;
          }
        }
      }
    };

    const data = {};
    for (const field of definition) {
      parseField(field, data, []);
    }
    return data;
  }

  /**
   * @param {Number} protocolVersion
   * @param {String|Number|Object} identifier
   * @param {Number} [definitionVersion]
   * @param {Object} data
   * @param {Stream.Writeable} [writer]
   * @param {String} [customName]
   * @returns {Buffer}
   */
  write(protocolVersion, identifier, definitionVersion, data, writer, customName, customCode) {
    // parse args
    if (typeof definitionVersion === 'object') {
      data = definitionVersion;
      definitionVersion = '*';
    }

    if (!definitionVersion) definitionVersion = '*';
    if (!data) data = {};

    let { name, code, version, definition } =
      this.resolveIdentifier(protocolVersion, identifier, definitionVersion, customName);

    code = code || customCode;

    const displayName = (version !== '?') ? `${name}<${version}>` : name;

    // set up optional arg `writer`
    if (!writer) {
      // make sure `code` is valid
      if (code == null || code < 0) {
        throw new Error(`[protocol] write ("${name}"): invalid code "${code}"'`);
      }

      // set up stream
      const length = 4 + this.getLength(definition, data);
      writer = new Stream.Writeable(length);
      writer.uint16(length);
      writer.uint16(code);
    }

    // begin writing
    const count = new Map();
    const offset = new Map();

    const writeField = ([key, type], dataObj, keyPathBase = '') => {
      const value = dataObj[key];
      const keyPath = (keyPathBase !== '') ? `${keyPathBase}.${key}` : key;

      // `type` is array or object
      if (Array.isArray(type)) {
        if (type.type === 'object') {
          for (const field of type) {
            writeField(field, value || {}, keyPath);
          }
          return;
        }

        if (!value) return;

        const length = value.length;
        if (length !== 0) {
          // write length in header
          const here = writer.position;
          writer.seek(count.get(keyPath));
          writer.uint16(length);
          writer.seek(here);

          // iterate elements
          let last = offset.get(keyPath);
          for (const element of value) {
            // write position in last element (or header)
            const hereElem = writer.position;
            writer.seek(last);
            writer.uint16(hereElem);
            writer.seek(hereElem);

            // write position in current element
            writer.uint16(hereElem);

            // store position pointing to next element
            last = writer.position;

            // write placeholder position
            writer.uint16(0);

            // recurse
            this.write(null, type, version, element, writer, `${displayName}.${keyPath}`);
          }
        }
      // `type` is primitive
      } else {
        switch (type) {
          // save position and write placeholders for count and offset
          case 'count': {
            count.set(keyPath, writer.position);
            writer.uint16(0);
            break;
          }

          case 'offset': {
            offset.set(keyPath, writer.position);
            writer.uint16(0);
            break;
          }

          // otherwise,
          default: {
            // update count
            if (count.has(keyPath) && value) {
              const here = writer.position;
              writer.seek(count.get(keyPath));
              writer.uint16(value.length);
              writer.seek(here);
            }

            // update offset
            if (offset.has(keyPath)) {
              const here = writer.position;
              writer.seek(offset.get(keyPath));
              writer.uint16(here);
              writer.seek(here);
            }

            // write it
            try {
              writer[type](value);
            } catch (err) {
              err.message = [
                `[protocol] write - ${displayName}: error writing "${keyPath}" (type: ${type})`,
                `data: ${util.inspect(value)}`,
                `reason: ${err.message}`,
              ].join('\n');
              throw err;
            }
          }
        }
      }
    };

    for (const field of definition) {
      writeField(field, data);
    }

    return writer.buffer;
  }

  /**
   * @returns {TeraProtocol}
   */
  // eslint-disable-next-line class-methods-use-this
  createInstance(...args) {
    return new TeraProtocol(...args);
  }
}

module.exports = new TeraProtocol();
