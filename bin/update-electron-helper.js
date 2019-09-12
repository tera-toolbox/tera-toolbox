const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const StreamZip = require('node-stream-zip');
const { isAdmin, rimraf } = require('./utils');

const ElectronFolder = path.join(__dirname, '..', 'node_modules', 'electron');
const ZipPath = path.join(__dirname, '..', 'electron.zip');

// Wait a bit to make sure that Electron is terminated properly.
isAdmin().then(RunAsAdmin => {
    setTimeout(() => {
        const zip = new StreamZip({
            file: ZipPath,
            storeEntries: true
        });

        zip.on('ready', () => {
            rimraf(ElectronFolder);
            fs.mkdirSync(ElectronFolder);
            fs.mkdirSync(path.join(ElectronFolder, 'dist'));
            zip.extract(null, path.join(ElectronFolder, 'dist'), (err, count) => {
                zip.close();
                fs.unlinkSync(ZipPath);

                let main = spawn(path.join(__dirname, '..', RunAsAdmin ? 'TeraToolbox.exe' : 'TeraToolbox_NoAdmin.exe'), [], { detached: true });
                main.unref();
                process.exit();
            });
        });
    }, 2000);
});
