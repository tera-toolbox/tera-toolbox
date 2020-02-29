'use strict';

const fs = require('fs');
const log = require('../logger');

// helper functions
const META_TYPE = {
    array: 'refArray',
    bytes: 'refBytes',
    string: 'refString',
};

function getKeyPath(base, key) {
    let ref = base;
    const keyPath = [key];
    while (ref.type === 'object') {
        keyPath.unshift(ref.name);
        ref = ref.up;
    }
    return [keyPath.join('.'), ref];
}

function pushMetaType(base, key, type) {
    const metaType = META_TYPE[type];
    if (!metaType)
        return;

    const [kp, ref] = getKeyPath(base, key);
    ref.meta.push([kp, metaType]);
}

function linkMetaTypes(def) {
    for (let [k, t] of def) {
        const refType = META_TYPE[Array.isArray(t) ? t.type : t];
        if (refType) {
            const [kp, ref] = getKeyPath(def, k);
            const meta = ref.find(([rk, rt]) => rk === kp);
            if (!meta)
                throw new Error(`No reference specified for field "${kp}"!`);
            meta[1] = refType;
        }

        if (Array.isArray(t))
            linkMetaTypes(t);
    }
}

function flatten(def, implicitMeta = true) {
    const obj = [].concat(
        implicitMeta ? def.meta : [],
        def.map(([k, t]) => [k, Array.isArray(t) ? flatten(t, implicitMeta) : t])
    );

    obj.type = def.type;
    if (def.subtype)
        obj.subtype = def.subtype;
    if (def.flags)
        obj.flags = def.flags;
    return obj;
}

// main
function parseSync(filepath, filecontent = null) {
    const data = ((filecontent !== null) ? filecontent : fs.readFileSync(filepath, { encoding: 'utf8' })).split(/\r?\n/);

    const definition = [];
    let implicitMeta = true;
    let level = 0;
    let top = definition; // pointer to current level
    top.meta = [];
    top.type = 'root';

    let numReferences = 0;
    let numReferenced = 0;

    for (let i = 0; i < data.length; i++) {
        // clean line
        const line = data[i].replace(/#.*$/, '').trim();
        if (!line) continue;

        const match = line.match(/^((?:-\s*)*)(\S+?)(<\s*\S+\s*>)?(\[\s*\S+\s*\])?\s+(\S+)$/);
        if (!match) {
            log.debug(`[parsers/def] parse error: malformed line\n    at "${filepath}", line ${i + 1}`);
            continue;
        }

        const depth = match[1].replace(/[^-]/g, '').length;
        let type = match[2];
        const subtype = match[3] ? match[3].replace(/[\s<>]/g, '') : undefined;
        const flags = match[4] ? match[4].replace(/[\s\[\]]/g, '').split(',') : [];
        const key = match[5];

        // Upgrade to 'ref' from old 'count'/'offset' format
        if (type === 'count')
            continue;
        if (type === 'offset') {
            log.debug(`[parsers/def] parse warning: 'count'/'offset' are deprecated, upgrading to 'ref' ("${filepath}" line ${i + 1})`);
            type = 'ref';
        }

        if (type === 'ref') {
            ++numReferences;
            implicitMeta = false;
        }

        // check if we need to move up or down a level
        // move deeper
        if (depth > level) {
            level++;

            // sanity check
            if (depth !== level)
                log.debug(`[parsers/def] parse warning: array nesting too deep ("${filepath}" line ${i + 1})`);

            // we are defining the subfields for the last field we saw,
            // so move current level to the `type` value (2nd elem) of the last field
            top = top[top.length - 1][1];
            // move up
        } else {
            // pop the stack to match the correct depth
            while (depth < level) {
                top = top.up;
                level--;
            }
        }

        // append necessary metadata field
        if (implicitMeta)
            pushMetaType(top, key, type);
        if (type === 'array' || type === 'bytes' || type === 'string')
            ++numReferenced;

        // append the field to the current level
        if (type === 'array' || type === 'object') {
            const group = [];
            group.type = type;
            if (type === 'array') {
                if (subtype)
                    group.subtype = subtype;
                if (flags)
                    group.flags = flags;
            }
            group.name = key;
            group.up = top;
            group.meta = [];
            top.push([key, group]);
        } else {
            top.push([key, type]);
        }
    }

    if (!implicitMeta) {
        linkMetaTypes(definition);
        if (numReferences !== numReferenced)
            log.debug(`[parsers/def] parse warning: mismatching explicit reference count: expecting ${numReferenced}, found ${numReferences} ("${filepath}")`);
    }

    return flatten(definition, implicitMeta);
}

module.exports = parseSync;
