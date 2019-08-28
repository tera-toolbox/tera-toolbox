// requires
const fs = require('fs');
const path = require('path');

const log = require('../logger');
const Stream = require('./stream');
const defParser = require('../parsers/def');

// constants
const PATH_DEFS = 'protocol';
const PLATFORMS = ['pc', 'console', 'classic'];
const POD_TYPES = ['bool', 'byte', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64', 'float', 'double', 'vec3', 'vec3fa', 'angle', 'skillid32', 'skillid', 'customize'];

// def compilation
function _countName(fullName) {
    return `count_${fullName.replace(/[\.\[\]]/g, '_')}`;
}

function _offsetName(fullName) {
    return `offset_${fullName.replace(/[\.\[\]]/g, '_')}`;
}

function _elemName(fullName) {
    return `elem_${fullName.replace(/[\.\[\]]/g, '_')}`;
}

function _transpileReader(definition, path = '') {
    let result = '';

    for (const [name, type] of definition) {
        const fullName = (path !== '') ? `${path}.${name}` : name;

        if (!Array.isArray(type)) {
            switch (type) {
                case 'refArray': {
                    result += `const ${_countName(fullName)} = stream.uint16();\n`;
                    result += `const ${_offsetName(fullName)} = stream.uint16();\n`;
                    break;
                }

                case 'refBytes': {
                    result += `const ${_offsetName(fullName)} = stream.uint16();\n`;
                    result += `const ${_countName(fullName)} = stream.uint16();\n`;
                    break;
                }

                case 'refString': {
                    result += `const ${_offsetName(fullName)} = stream.uint16();\n`;
                    break;
                }

                case 'string': {
                    // TODO: check offset
                    result += `stream.seek(${_offsetName(fullName)});\n`;
                    result += `${fullName} = stream.string();\n`;
                    break;
                }

                case 'bytes': {
                    // TODO: check offset
                    result += `stream.seek(${_offsetName(fullName)});\n`;
                    result += `${fullName} = stream.bytes(${_countName(fullName)});\n`;
                    break;
                }

                default: {
                    if (!POD_TYPES.includes(type))
                        throw new Error(`Invalid data type "${type}" for field "${fullName}"!`);

                    result += `${fullName} = stream.${type}();\n`;
                    break;
                }
            }
        } else {
            switch (type.type) {
                case 'object': {
                    result += `${fullName} = {};\n`;
                    result += _transpileReader(type, fullName);
                    break;
                }

                case 'array': {
                    const offsetName = _offsetName(fullName);
                    const tmpOffsetName = `tmpoffset_${offsetName}`;
                    const tmpIndexName = `tmpindex_${offsetName}`;
                    const curElemName = `${fullName}[${tmpIndexName}]`;

                    result += `${fullName} = new Array(${_countName(fullName)});\n`;
                    result += `let ${tmpOffsetName} = ${offsetName};\n`;
                    result += `let ${tmpIndexName} = 0;\n`;
                    result += `while (${tmpOffsetName} && ${tmpIndexName} < ${_countName(fullName)}) {\n`;

                    // TODO: check offset
                    result += `stream.seek(${tmpOffsetName} + 2);\n`;
                    result += `${tmpOffsetName} = stream.uint16();\n`;

                    if (type.subtype) {
                        if (type.subtype === 'string') {
                            // TODO: check offset
                            result += `stream.skip(2);\n`;
                            result += `${curElemName} = stream.string();\n`;
                        } else {
                            if (!POD_TYPES.includes(type.subtype))
                                throw new Error(`Invalid data type "${type.subtype}" for array "${fullName}"!`);

                            result += `${curElemName} = stream.${type.subtype}();\n`;
                        }
                    } else {
                        result += `${curElemName} = {};\n`;
                        result += _transpileReader(type, curElemName);
                    }

                    result += `++${tmpIndexName};\n`;
                    result += '}\n';
                    break;
                }

                default:
                    throw new Error(`Invalid aggregate type "${type}" for field "${fullName}"!`);
            }
        }
    }

    return result;
}

function _transpileWriter(definition, path = '', empty = false) {
    let result = '';

    // Cache interleaved arrays
    let interleavedArrays = [];
    let interleavedArrayDefinitions = {};
    let interleavedArraysFirstIdx = null;
    for (let i = 0; i < definition.length; ++i) {
        const [name, type] = definition[i];
        if (Array.isArray(type) && type.type === 'array' && type.flags.includes('interleaved')) {
            if (interleavedArraysFirstIdx !== null && interleavedArraysFirstIdx + 1 !== i)
                throw new Error('Interleaved arrays must be consecutive fields!');

            interleavedArraysFirstIdx = i;
            interleavedArrays.push(name);
            interleavedArrayDefinitions[name] = type;
        }
    }

    for (const [name, type] of definition) {
        if (interleavedArrays.includes(name) && Array.isArray(type)) {
            // Check if already serialized
            if (empty || interleavedArrays[0] !== name)
                continue;

            // Initialize header
            const nameInfo = {};
            interleavedArrays.forEach(name_ => {
                const fullName = (path !== '') ? `${path}.${name_}` : name_;
                const offsetName = _offsetName(fullName);
                const tmpLastName = `tmplast_${offsetName}`;
                const tmpCurrentName = `tmpcurrent_${offsetName}`;
                nameInfo[name_] = { fullName, offsetName, tmpLastName, tmpCurrentName };

                result += `let ${tmpLastName} = ${offsetName};\n`;
                result += `let ${tmpCurrentName} = stream.position;\n`;
            });

            const lengthName = _elemName((path !== '') ? `${path}._interleaved_maxlength` : '_interleaved_maxlength');
            const idxName = _elemName((path !== '') ? `${path}._interleaved_index` : '_interleaved_index');
            result += `const ${lengthName} = Math.max(${interleavedArrays.map(name_ => `${nameInfo[name_].fullName} ? ${nameInfo[name_].fullName}.length : 0`).join(',')});\n`;
            result += `for (let ${idxName} = 0; ${idxName} < ${lengthName}; ++${idxName}) {\n`;
            interleavedArrays.forEach(name_ => {
                result += `if (${nameInfo[name_].fullName} && ${idxName} < ${nameInfo[name_].fullName}.length) {\n`;
                result += `${nameInfo[name_].tmpCurrentName} = stream.position;\n`;
                result += `stream.seek(${nameInfo[name_].tmpLastName});\n`;
                result += `stream.uint16(${nameInfo[name_].tmpCurrentName});\n`;
                result += `stream.seek(${nameInfo[name_].tmpCurrentName});\n`;
                result += `stream.uint16(${nameInfo[name_].tmpCurrentName});\n`;
                result += `${nameInfo[name_].tmpLastName} = stream.position;\n`;
                result += `stream.uint16(0);\n`;

                const curElemName = `${nameInfo[name_].fullName}[${idxName}]`;
                if (interleavedArrayDefinitions[name_].subtype) {
                    if (interleavedArrayDefinitions[name_].subtype === 'string') {
                        result += `stream.uint16(stream.position + 2);\n`;
                        result += `stream.string(${curElemName});\n`;
                    } else {
                        if (!POD_TYPES.includes(interleavedArrayDefinitions[name_].subtype))
                            throw new Error(`Invalid data type "${interleavedArrayDefinitions[name_].subtype}" for array "${nameInfo[name_].fullName}"!`);

                        result += `stream.${interleavedArrayDefinitions[name_].subtype}(${curElemName});\n`;
                    }
                } else {
                    result += _transpileWriter(interleavedArrayDefinitions[name_], curElemName);
                }
                result += '}\n';
            });
            result += '}\n';
        } else {
            const fullName = (path !== '') ? `${path}.${name}` : name;

            if (!Array.isArray(type)) {
                switch (type) {
                    case 'refArray': {
                        result += `stream.uint16(${fullName} ? ${fullName}.length : 0);\n`;
                        result += `const ${_offsetName(fullName)} = stream.position;\n`;
                        result += 'stream.uint16(0);\n';
                        break;
                    }

                    case 'refBytes': {
                        result += `const ${_offsetName(fullName)} = stream.position;\n`;
                        result += 'stream.uint16(0);\n';
                        result += `stream.uint16(${fullName} ? ${fullName}.length : 0);\n`;
                        break;
                    }

                    case 'refString': {
                        result += `const ${_offsetName(fullName)} = stream.position;\n`;
                        result += 'stream.uint16(0);\n';
                        break;
                    }

                    case 'string': {
                        const offsetName = _offsetName(fullName);
                        const tmpName = `tmp_${offsetName}`;

                        result += `const ${tmpName} = stream.position;\n`;
                        result += `stream.seek(${offsetName});\n`;
                        result += `stream.uint16(${tmpName});\n`;
                        result += `stream.seek(${tmpName});\n`;

                        if (empty)
                            result += `stream.string();\n`;
                        else
                            result += `stream.string(${fullName});\n`;
                        break;
                    }

                    case 'bytes': {
                        const offsetName = _offsetName(fullName);
                        const tmpName = `tmp_${offsetName}`;

                        result += `const ${tmpName} = stream.position;\n`;
                        result += `stream.seek(${offsetName});\n`;
                        result += `stream.uint16(${tmpName});\n`;
                        result += `stream.seek(${tmpName});\n`;

                        if (!empty)
                            result += `stream.bytes(${fullName});\n`;
                        break;
                    }

                    default: {
                        if (!POD_TYPES.includes(type))
                            throw new Error(`Invalid data type "${type}" for field "${fullName}"!`);

                        if (empty)
                            result += `stream.${type}();\n`;
                        else
                            result += `stream.${type}(${fullName});\n`;
                        break;
                    }
                }
            } else {
                switch (type.type) {
                    case 'object': {
                        if (!empty) {
                            result += `if (${fullName}) {\n`;
                            result += _transpileWriter(type, fullName, false);
                            result += '} else {\n';
                        }

                        result += _transpileWriter(type, fullName, true);

                        if (!empty)
                            result += '}\n';

                        break;
                    }

                    case 'array': {
                        if (empty)
                            break;

                        const offsetName = _offsetName(fullName);
                        const tmpLastName = `tmplast_${offsetName}`;
                        const tmpCurrentName = `tmpcurrent_${offsetName}`;
                        const curElemName = _elemName(fullName);

                        result += `if (${fullName} && ${fullName}.length > 0) {\n`;
                        result += `let ${tmpLastName} = ${offsetName};\n`;
                        result += `let ${tmpCurrentName} = stream.position;\n`;
                        result += `for (const ${curElemName} of ${fullName}) {\n`;
                        result += `${tmpCurrentName} = stream.position;\n`;
                        result += `stream.seek(${tmpLastName});\n`;
                        result += `stream.uint16(${tmpCurrentName});\n`;
                        result += `stream.seek(${tmpCurrentName});\n`;
                        result += `stream.uint16(${tmpCurrentName});\n`;
                        result += `${tmpLastName} = stream.position;\n`;
                        result += `stream.uint16(0);\n`;

                        if (type.subtype) {
                            if (type.subtype === 'string') {
                                result += `stream.uint16(stream.position + 2);\n`;
                                result += `stream.string(${curElemName});\n`;
                            } else {
                                if (!POD_TYPES.includes(type.subtype))
                                    throw new Error(`Invalid data type "${type.subtype}" for array "${fullName}"!`);

                                result += `stream.${type.subtype}(${curElemName});\n`;
                            }
                        } else {
                            result += _transpileWriter(type, curElemName);
                        }

                        result += '}\n';
                        result += '}\n';
                        break;
                    }

                    default:
                        throw new Error(`Invalid aggregate type "${type}" for field "${fullName}"!`);
                }
            }
        }
    }

    return result;
}

function transpile(definition) {
    return {
        reader: 'let result = {};\n' + _transpileReader(definition, 'result') + 'return result;',
        writer: _transpileWriter(definition, 'data')
    };
}

function compile(definition) {
    const transpiled = transpile(definition);
    return {
        reader: Function('stream', '"use strict";\n' + transpiled.reader),
        writer: Function('stream', 'data', '"use strict";\n' + transpiled.writer)
    };
}

function parseDefinitionFilename(file) {
    const parsedName = path.basename(file).match(/^(\w+)\.(\d+)(\.(\w+))?\.(def|js)$/);
    if (!parsedName) {
        if (file.endsWith('.def') || file.endsWith('.js'))
            log.warn(`[protocol] load (def) - invalid filename syntax "${path.basename(file)}"`);
        else
            log.debug(`[protocol] load (def) - skipping path "${path.basename(file)}"`);
        return null;
    }

    return {
        name: parsedName[1],
        version: parseInt(parsedName[2], 10),
        platform: parsedName[4],
        type: parsedName[5]
    };
}

// implementation
class TeraProtocol {
    constructor(region, majorPatchVersion, minorPatchVersion, protocolMap, platform = 'pc') {
        if (!PLATFORMS.includes(platform))
            throw new Error('Invalid platform!');

        this.region = region;
        this.majorPatchVersion = majorPatchVersion;
        this.minorPatchVersion = minorPatchVersion;
        this.platform = platform;
        this.protocolMap = protocolMap;
        this.messages = new Map();
        this.writeStream = new Stream.Writeable(0x10000);

        this.loaded = false;
    }

    _assignDeprecationFlags(name, version, definition) {
        definition.writeable = definition.readable = true;
        if (this.deprecationData[name] && this.deprecationData[name][version]) {
            const data = this.deprecationData[name][version];
            if ((!data['min'] || data['min'] > this.majorPatchVersion) && (!data['max'] || data['max'] < this.majorPatchVersion)) {
                definition.writeable = false;
                definition.readable = !!data['readable'];
            }
        }

        return definition;
    }

    addDefinition(name, version, definition, overwrite = false) {
        // Compile definition if required
        if (typeof definition.writer !== 'function' || typeof definition.reader !== 'function') {
            try {
                definition = compile(definition);
            } catch (e) {
                log.error(`[protocol] Error while compiling definition "${name}.${version}":`);
                log.error(e);
                return;
            }
        }

        // Add to map
        if (!this.messages.has(name))
            this.messages.set(name, new Map());
        if (overwrite || !this.messages.get(name).get(version))
            this.messages.get(name).set(version, this._assignDeprecationFlags(name, version, definition));
    }

    isDefaultDefinition(name, version) {
        return this.defaultDefinitions.has(`${name}.${version}`);
    }

    isCustomDefinition(name, version) {
        return !this.isDefaultDefinition(name, version);
    }

    /**
     * Loads (or reloads) the opcode mapping and message definitions.
     * @param {String} [basePath] Path to the base package.json.
     */
    load(basePath = require.resolve('tera-data')) {
        if (path.basename(basePath) === 'package.json')
            basePath = path.dirname(basePath);

        // read deprecation data
        const manifest = JSON.parse(fs.readFileSync(path.join(basePath, 'manifest.json')));
        const defaultDefData = Object.keys(manifest.protocol).map(file => parseDefinitionFilename(file));
        const lowestDefaultDefVersions = {};
        defaultDefData.forEach(def => {
            if (lowestDefaultDefVersions[def.name])
                lowestDefaultDefVersions[def.name] = Math.min(lowestDefaultDefVersions[def.name], def.version);
            else
                lowestDefaultDefVersions[def.name] = def.version;
        });

        this.deprecationData = manifest.deprecated || {};
        this.defaultDefinitions = new Set(defaultDefData.map(def => `${def.name}.${def.version}`));

        // reset messages
        this.messages.clear();

        // read protocol directory
        const defPath = path.join(basePath, PATH_DEFS);
        const defFiles = fs.readdirSync(defPath);
        for (const file of defFiles) {
            const fullpath = path.join(defPath, file);
            const parsedName = parseDefinitionFilename(file);
            if (!parsedName)
                continue;

            if (parsedName.version !== 0 && lowestDefaultDefVersions[parsedName.name] && parsedName.version < lowestDefaultDefVersions[parsedName.name]) {
                log.debug(`Skipped loading outdated def ${parsedName.name}.${parsedName.version}! Consider cleaning your tera-data folder.`);
                continue;
            }

            // Always prefer platform-specific definition over default one!
            const definition = (parsedName.type === 'js') ? require(fullpath) : defParser(fullpath);
            if (definition && (!parsedName.platform || parsedName.platform === this.platform))
                this.addDefinition(parsedName.name, parsedName.version, definition, !!parsedName.platform);
        }

        this.loaded = true;
        return true;
    }

    /**
     * Given an identifier, retrieve the name, opcode, and definition object.
     * @param {String|Number} identifier
     * @param {Number} [definitionVersion]
     * @returns Object An object with the `definition` property set, plus a `name` and `code`.
     * @throws {TypeError} `identifier` must be one of the listed types.
     * @throws Errors if supplied an opcode that could not be mapped to a `name`.
     * @throws Errors if a `definition` cannot be found.
     */
    resolveIdentifier(identifier, definitionVersion = '*') {
        const { protocolMap, messages } = this;
        let name;
        let code;
        let version;
        let definition;
        let latest_version;

        // Resolve code and name
        switch (typeof identifier) {
            case 'string': {
                name = identifier;
                if (!protocolMap.name.has(name))
                    throw new Error(`code not known for message "${name}"`);

                code = protocolMap.name.get(name);
                break;
            }

            case 'number': {
                code = identifier;
                if (!protocolMap.code.has(code))
                    throw new Error(`mapping not found for opcode ${code}`);

                name = protocolMap.code.get(code);
                break;
            }

            default:
                throw new TypeError('identifier must be a string or number');
        }

        // Resolve definition
        const versions = messages.get(name);
        if (versions) {
            latest_version = Math.max(...versions.keys());

            version = (definitionVersion === '*') ? latest_version : definitionVersion;
            definition = versions.get(version);
        }

        if (!definition) {
            if (latest_version && version && version < latest_version)
                throw new Error(`version ${version} of message (name: "${name}", code: ${code}) is outdated and cannot be used anymore`);
            else
                throw new Error(`no definition found for message (name: "${name}", code: ${code}, version: ${definitionVersion})`);
        }

        return { name, code, version, latest_version, definition };
    }

    /**
     * @param {String|Number} identifier
     * @param {Number} [definitionVersion]
     * @param {Buffer} data
     * @returns {Object}
     */
    parse(identifier, definitionVersion, data) {
        const { name, version, definition } = this.resolveIdentifier(identifier, definitionVersion);
        if (!definition.readable)
            throw new Error(`version ${version} of message (name: "${name}", code: ${code}) is deprecated and cannot be used for reading`);
        return definition.reader(new Stream.Readable(data, 4));
    }

    /**
     * @param {String|Number} identifier
     * @param {Number|'*'} [definitionVersion]
     * @param {Object} data
     * @returns {Buffer}
     */
    write(identifier, definitionVersion, data) {
        const { code, name, version, definition } = this.resolveIdentifier(identifier, definitionVersion);
        if (!definition.writeable)
            throw new Error(`version ${version} of message (name: "${name}", code: ${code}) is deprecated and cannot be used for writing`);

        // write data
        const { writeStream } = this;
        writeStream.seek(4);
        definition.writer(writeStream, data || {});

        // write header
        const length = this.writeStream.position;
        writeStream.seek(0);
        writeStream.uint16(length);
        writeStream.uint16(code);

        let result = Buffer.allocUnsafe(length);
        writeStream.buffer.copy(result, 0, 0, length);
        return result;
    }
}

module.exports = TeraProtocol;
