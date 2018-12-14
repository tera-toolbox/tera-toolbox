const path = require('path');
const fs = require('fs');
const ConfigFilePath = path.join(__dirname, '..', 'config.json');

function loadConfig() {
    return JSON.parse(fs.readFileSync(ConfigFilePath, 'utf8'));
}

function saveConfig(newConfig) {
    fs.writeFileSync(ConfigFilePath, JSON.stringify(newConfig, null, 4));
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

module.exports = { loadConfig, saveConfig, loadRegion };
