const RequiredVersion = '6.0.5';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function updateRequired() {
    return process.versions.electron !== RequiredVersion;
}

async function update() {
    const fetch = require('node-fetch');
    const data = await (await fetch(`https://github.com/electron/electron/releases/download/v${RequiredVersion}/electron-v${RequiredVersion}-${process.platform}-${process.arch}.zip`)).buffer();
    fs.writeFileSync(path.join(__dirname, '..', 'electron.zip'), data, { encoding: null});

    let main = spawn('node', [path.join(__dirname, 'update-electron-helper.js')], { detached: true });
    main.unref();
}

module.exports = { RequiredVersion, updateRequired, update };
