const path = require("path");
const fs = require("fs");

/**
 * Remove directory recursively
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
function rimraf(dir_path) {
    try {
        fs.readdirSync(dir_path).forEach(entry => {
            const entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory())
                rimraf(entry_path);
            else
                fs.unlinkSync(entry_path);
        });

        fs.rmdirSync(dir_path);
    } catch (e) {
        // Ignore
    }
}

// Migrate from old proxy versions
function ProxyMigration() {
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

module.exports = { ProxyMigration };
