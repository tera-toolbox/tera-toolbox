const path = require("path");
const fs = require("fs");
const { rimraf } = require('./utils');

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
    try {
        fs.unlinkSync(path.join(__dirname, "index.js"));
        fs.unlinkSync(path.join(__dirname, "loader.js"));
        fs.unlinkSync(path.join(__dirname, "loader-console.js"));
        fs.unlinkSync(path.join(__dirname, "hosts.js"));
        fs.unlinkSync(path.join(__dirname, "netstat.js"));
        fs.unlinkSync(path.join(__dirname, "regions.js"));
        fs.unlinkSync(path.join(__dirname, "gui", "index.html"));
    } catch (e) {
        // Ignore
    }
}

module.exports = { ToolboxMigration };
