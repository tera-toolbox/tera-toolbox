const path = require("path");
const fs = require("fs");

// Migrate from old proxy versions
function ProxyMigration() {
    // Delete legacy servers folder
    try {
        const serversFolder = path.join(__dirname, 'servers');
        fs.readdirSync(serversFolder).forEach(entry => fs.unlinkSync(path.join(serversFolder, entry)));
        fs.rmdirSync(serversFolder);
    } catch (e) {
        // Ignore
    }

    // Delete legacy tera-proxy-sls folder
    try {
        const slsFolder = path.join(__dirname, '..', 'node_modules', 'tera-proxy-sls');

        try {
            const slsResFolder = path.join(slsFolder, 'res');
            fs.readdirSync(slsResFolder).forEach(entry => fs.unlinkSync(path.join(slsResFolder, entry)));
            fs.rmdirSync(slsResFolder);
        } catch (e) {
            // Ignore
        }

        fs.readdirSync(slsFolder).forEach(entry => fs.unlinkSync(path.join(slsFolder, entry)));
        fs.rmdirSync(slsFolder);
    } catch (e) {
        // Ignore
    }

    // Delete no longer used files
    try {
        fs.unlinkSync(path.join(__dirname, "index.js"));
        fs.unlinkSync(path.join(__dirname, "loader.js"));
        fs.unlinkSync(path.join(__dirname, "loader-console.js"));
        fs.unlinkSync(path.join(__dirname, "hosts.js"));
        fs.unlinkSync(path.join(__dirname, "netstat.js"));
        fs.unlinkSync(path.join(__dirname, "regions.js"));
    } catch (e) {
        // Ignore
    }
}

module.exports = { ProxyMigration };

/*
// Now everything is ready to launch the actual proxy code in a second-stage loader
if (process.versions.electron) {
    // For GUI proxy, we'll need to launch a new process and terminate the current process/console window
    const { spawn } = require('child_process');

    let args = [...process.argv.slice(1, -1), path.join(__dirname, 'loader-gui.js')];
    spawn(process.argv[0], args, { detached: true, shell: false, stdio: 'ignore' });
    process.exit();
} else {
    // For console proxy, we can just re-use the already running node process/console window
    require('./loader-console');
}
*/