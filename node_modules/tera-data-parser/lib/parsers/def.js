'use strict'

const fs = require('fs');
const log = require('../logger');

// helper functions
const META_TYPES = {
  array: ['count', 'offset'],
  bytes: ['offset', 'count'],
  string: ['offset'],
};

function pushMetaTypes(base, key, type) {
  const metaTypes = META_TYPES[type];
  if (!metaTypes) return;

  // get key path
  let ref = base;
  const keyPath = [key];
  while (ref.type === 'object') {
    keyPath.unshift(ref.name);
    ref = ref.up;
  }
  const kp = keyPath.join('.');

  //
  for (const t of metaTypes) {
    ref.meta.push([kp, t]);
  }
}

function flatten(def, implicitMeta = true) {
  const obj = [].concat(
    implicitMeta ? def.meta : [],
    def.map(([k, t]) => [k, Array.isArray(t) ? flatten(t, implicitMeta) : t])
  );
  obj.type = def.type;
  return obj;
}

// main
function parseSync(filepath) {
  log.trace(`[parsers/def] reading "${filepath}"`);

  const data = fs.readFileSync(filepath, { encoding: 'utf8' }).split(/\r?\n/);

  const definition = [];
  let implicitMeta = true;
  let level = 0;
  let top = definition; // pointer to current level
  top.meta = [];
  top.type = 'root';

  for (let i = 0; i < data.length; i++) {
    // clean line
    const line = data[i].replace(/#.*$/, '').trim();
    if (!line) continue;

    const match = line.match(/^((?:-\s*)*)(\S+)\s+(\S+)$/);
    if (!match) {
      log.warn(`[parsers/def] parse error: malformed line\n    at "${filepath}", line ${i + 1}`);
      continue;
    }

    const depth = match[1].replace(/[^-]/g, '').length;
    const type = match[2];
    const key = match[3];

    if (implicitMeta && (type === 'count' || type === 'offset')) {
      log.warn(`[parsers/def] parse warning: "count" or "offset" encountered, disabling implicit metatypes\n    at "${filepath}", line ${i + 1}`);
      implicitMeta = false;
    }

    // check if we need to move up or down a level
    // move deeper
    if (depth > level) {
      level++;

      // sanity check
      if (depth !== level) {
        log.warn(`[parsers/def] parse warning: array nesting too deep\n    at "${filepath}", line ${i + 1}`);
      }

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

    // append necessary metadata fields
    pushMetaTypes(top, key, type);

    // append the field to the current level
    if (type === 'array' || type === 'object') {
      const group = [];
      group.type = type;
      group.name = key;
      group.up = top;
      group.meta = [];
      top.push([key, group]);
    } else {
      top.push([key, type]);
    }
  }

  return flatten(definition, implicitMeta);
}

module.exports = parseSync;
