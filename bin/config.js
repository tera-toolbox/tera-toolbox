const path = require('path');
const fs = require('fs');
const ConfigFilePath = path.join(__dirname, '..', 'config.json');

function loadConfig() {
    let result = null;
    try {
        result = fs.readFileSync(ConfigFilePath, 'utf8');
    } catch (_) {
        return {
            branch: 'master',
            uilanguage: 'en',
            updatelog: false,
            devmode: false,
            noselfupdate: false,
            noupdate: false,
            noslstags: false,
            noserverautojoin: false
        };
    }

    return JSON.parse(result, (key,val) => (typeof val === "string" && val.includes("bigint:")) ? BigInt(val.replace('bigint:', '')) : val);
}

function saveConfig(newConfig) {
    fs.writeFileSync(ConfigFilePath, JSON.stringify(newConfig, (key,val) => typeof val === "bigint" ? String(`bigint:${val}`) : val, 4));
}

module.exports = { loadConfig, saveConfig };
