const path = require("path");
const fs = require("fs");
const { rimraf } = require('./utils');

function tryUnlink(file) {
    try {
        fs.unlinkSync(file);
    } catch (e) {
        // Ignore
    }
}

// Migrate from old versions
function ToolboxMigration() {
    // Delete legacy servers folder
    rimraf(path.join(__dirname, 'servers'));

    // Delete legacy node_modules folders
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-crypto-js'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-crypto-native'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-proxy-game'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-proxy-sls'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-data-parser', 'lib', 'sysmsg'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'long'));

    // Delete no longer used files
    tryUnlink(path.join(__dirname, "index.js"));
    tryUnlink(path.join(__dirname, "loader.js"));
    tryUnlink(path.join(__dirname, "loader-console.js"));
    tryUnlink(path.join(__dirname, "hosts.js"));
    tryUnlink(path.join(__dirname, "netstat.js"));
    tryUnlink(path.join(__dirname, "regions.js"));
    tryUnlink(path.join(__dirname, "gui", "index.html"));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-data-parser', 'lib', 'protocol', 'stream.js'));
}

module.exports = { ToolboxMigration };
