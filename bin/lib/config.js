const path = require('path');

function loadConfig() {
    return require(path.join(__dirname, '..', 'config.json'));
}

function loadRegion(region) {
    const currentRegion = require(path.join(__dirname, 'regions'))[region];
    if (!currentRegion)
        throw new Error(`Invalid region: ${region}`);

    currentRegion.altHostnames = currentRegion.altHostnames || [];

    return {
        'id': region,
        'idShort': region.toLowerCase().split('-')[0],
        'platform': currentRegion.console ? 'console' : (currentRegion.classic ? 'classic' : 'pc'),
        'data': currentRegion,
    };
}

module.exports = { loadConfig, loadRegion };
