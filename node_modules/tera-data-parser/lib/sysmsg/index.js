'use strict'

// requires
const fs = require('fs');
const path = require('path');

const log = require('../logger');
const mapParser = require('../parsers/map');

// constants
const PATH_MAPS_BASE = 'map_base';

// exports
class TeraSysmsg {
  constructor() {
    this.maps = new Map();
    this.loaded = false;
  }

  load(basePath = require.resolve('tera-data')) {
    const { maps } = this;
    maps.clear();

    if (path.basename(basePath) === 'package.json') {
      basePath = path.dirname(basePath);
    }

    const mapPath = path.join(basePath, PATH_MAPS_BASE);
    const mapFiles = fs.readdirSync(mapPath);
    for (const file of mapFiles) {
      const fullpath = path.join(mapPath, file);

      const parsedName = path.basename(file).match(/^sysmsg.(\d+)\.map$/);
      if (!parsedName) {
        if (file.startsWith('sysmsg.') && file.endsWith('.map')) {
          log.warn(`[sysmsg] load - invalid filename syntax "${fullpath}"`);
        } else {
          log.debug(`[sysmsg] load - skipping path "${fullpath}"`);
        }
        continue;
      }

      const version = parseInt(parsedName[1], 10);
      const mapping = mapParser(fullpath);
      if (!mapping) continue;

      maps.set(version, mapping);
    }

    this.loaded = true;
    return true;
  }
}

module.exports = new TeraSysmsg();
module.exports.load(); // Temporary fix
