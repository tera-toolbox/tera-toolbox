const RequiredVersion = '5.0.1';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function updateRequired() {
    return process.versions.electron !== RequiredVersion;
}

async function update() {
    const request = require('request-promise-native');
    const data = await request({ url: `https://github.com/electron/electron/releases/download/v${RequiredVersion}/electron-v${RequiredVersion}-${process.platform}-${process.arch}.zip`, encoding: null });
    fs.writeFileSync(path.join(__dirname, '..', 'electron.zip'), data);

    let main = spawn('node', [path.join(__dirname, 'update-electron-helper.js')], { detached: true });
    main.unref();
}

module.exports = { RequiredVersion, updateRequired, update };
