const RequiredVersion = '11.0.5';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { isAdmin } = require('./utils');

function updateRequired() {
    return process.versions.electron !== RequiredVersion;
}

async function update() {
    const RunAsAdmin = await isAdmin();

    const fetch = require('node-fetch');
    const res = await fetch(`https://github.com/electron/electron/releases/download/v${RequiredVersion}/electron-v${RequiredVersion}-${process.platform}-x64.zip`);
    const data = await res.buffer();
    fs.writeFileSync(path.join(__dirname, '..', 'electron.zip'), data);

    let main = spawn(path.join(__dirname, '..', RunAsAdmin ? 'TeraToolbox.exe' : 'TeraToolbox_NoAdmin.exe'), [], { detached: true });
    main.unref();
}

module.exports = { RequiredVersion, updateRequired, update };
