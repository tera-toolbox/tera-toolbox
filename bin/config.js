const path = require('path');
const fs = require('fs');
const ConfigFilePath = path.join(__dirname, '..', 'config.json');

const bigIntSerializator = (key, value) => {
    typeof value === "bigint" ? `BIGINT:${value}` : value;
};

const bigIntDeserializator = (key, value) => {
    if (typeof value === "string" && value.startsWith("BIGINT:")) {
        return BigInt(value.substr(7));
    }
};

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

    return JSON.parse(result, bigIntDeserializator);
}

function saveConfig(newConfig) {
    fs.writeFileSync(ConfigFilePath, JSON.stringify(newConfig, bigIntSerializator, 4));
}

module.exports = { loadConfig, saveConfig };
