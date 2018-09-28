'use strict'

const fs = require('fs');
const log = require('../logger');

function parseSync(filepath) {
  log.trace(`[parsers/map] reading "${filepath}"`);

  const map = {
    name: new Map(),
    code: new Map(),
  };

  const data = fs.readFileSync(filepath, { encoding: 'utf8' }).split(/\r?\n/);
  for (let i = 0; i < data.length; i++) {
    const line = data[i].replace(/#.*$/, '').trim();
    if (!line) continue;

    // {name} {code}
    // {name} = {code}
    const match = line.match(/^(\S+)(?:\s+|\s*=\s*)(\S+)$/);
    if (!match) {
      log.warn(`[parsers/map] parse error: malformed line\n    at "${filepath}", line ${i + 1}`);
      continue;
    }

    const name = match[1];
    const code = parseInt(match[2], 10);
    if (isNaN(code)) {
      log.warn(`[parsers/map] parse error: non-numeric opcode\n    at "${filepath}", line ${i + 1}`);
      continue;
    }

    map.name.set(name, code);
    map.code.set(code, name);
  }

  return map;
}

module.exports = parseSync;
