const path = require('path');
const fs = require('fs');
const ConfigFilePath = path.join(__dirname, '..', 'config.json');

function loadConfig() {
    let result = null;
    try {
        result = fs.readFileSync(ConfigFilePath, 'utf8')
    } catch (_) {
        return {
            "branch": "master",
            "updatelog": false,
            "devmode": false,
            "noselfupdate": false,
            "noupdate": false,
            "noslstags": false
        };
    }

    return JSON.parse(result);
}

function saveConfig(newConfig) {
    fs.writeFileSync(ConfigFilePath, JSON.stringify(newConfig, null, 4));
}

module.exports = { loadConfig, saveConfig };
