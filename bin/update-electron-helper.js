const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const StreamZip = require('node-stream-zip');

const ElectronFolder = path.join(__dirname, '..', 'node_modules', 'electron');
const ZipPath = path.join(__dirname, '..', 'electron.zip');

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

        let main = spawn(path.join(__dirname, '..', 'TeraProxyGUI.bat'), [], { detached: true });
        main.unref();
        process.exit();
    });
});
