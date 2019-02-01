const path = require('path');
const fs = require('fs');
const ConfigFilePath = path.join(__dirname, '..', 'config.json');

function loadConfig() {
    return JSON.parse(fs.readFileSync(ConfigFilePath, 'utf8'));
}

function saveConfig(newConfig) {
    fs.writeFileSync(ConfigFilePath, JSON.stringify(newConfig, null, 4));
}

module.exports = { loadConfig, saveConfig };
