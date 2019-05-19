// Imports
const request = require('request-promise-native');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Constants
const AutoUpdateServers = ['https://raw.githubusercontent.com/tera-toolbox/tera-toolbox/', 'https://teralogs.lima-city.de/proxy/'];

// Implementation
function forcedirSync(dir) {
    const sep = path.sep;
    const initDir = path.isAbsolute(dir) ? sep : '';
    dir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (_) {
            // Ignore
        }

        return curDir;
    }, initDir);
}

function hash(data) {
    return crypto.createHash('sha256').update(data).digest().toString('hex').toUpperCase();
}

class Updater extends EventEmitter {
    constructor(branch = 'master') {
        super();
        this.setMaxListeners(0);

        this.branch = branch;
    }

    buildPath(relpath) { return path.join(__dirname, '..', relpath); }
    buildURL(serverIndex, relpath) { return `${AutoUpdateServers[serverIndex]}${this.branch}/${relpath}`; }
    async downloadRaw(serverIndex, relpath) { return await request({ url: this.buildURL(serverIndex, relpath), encoding: null }); }
    async downloadJSON(serverIndex, relpath) { return await request({ url: this.buildURL(serverIndex, relpath), json: true }); }

    async check(serverIndex = 0) {
        this.emit('check_start', serverIndex);

        try {
            const manifest = await this.downloadJSON(serverIndex, 'manifest.json');

            let operations = [];
            Object.keys(manifest.files).forEach(relpath => {
                const filedata = manifest.files[relpath];
                const filepath = this.buildPath(relpath);

                let expectedHash = null;
                let needsUpdate = false;
                if (typeof filedata === 'object') {
                    expectedHash = filedata.hash.toUpperCase();

                    if (filedata.overwrite === 'only')
                        needsUpdate = fs.existsSync(filepath) && hash(fs.readFileSync(filepath)) !== expectedHash;
                    else
                        needsUpdate = !fs.existsSync(filepath) || (filedata.overwrite && hash(fs.readFileSync(filepath)) !== expectedHash);
                } else {
                    expectedHash = filedata.toUpperCase();
                    needsUpdate = !fs.existsSync(filepath) || hash(fs.readFileSync(filepath)) !== expectedHash;
                }

                if (needsUpdate)
                    operations.push({
                        type: 'update',
                        hash: expectedHash,
                        relpath,
                        abspath: filepath
                    });
            });

            this.emit('check_success', serverIndex, operations);
            return {
                serverIndex,
                operations
            };
        } catch (e) {
            this.emit('check_fail', serverIndex, e);

            if (serverIndex + 1 < AutoUpdateServers.length) {
                return await this.check(serverIndex + 1);
            } else {
                this.emit('check_fail_all');
                throw e;
            }
        }
    }

    async run(checkResult = null) {
        this.emit('run_start');
        if (!checkResult)
            checkResult = await this.check();

        let success = true;
        if (checkResult.operations.length > 0) {
            this.emit('prepare_start');

            // Prepare and validate operations
            for (let operation of checkResult.operations) {
                switch (operation.type) {
                    case 'update': {
                        this.emit('download_start', checkResult.serverIndex, operation.relpath);
                        operation.data = await this.downloadRaw(checkResult.serverIndex, operation.relpath);
                        this.emit('download_finish', checkResult.serverIndex, operation.relpath);
                        if (operation.hash !== hash(operation.data))
                            throw Error(`Hash mismatch for file "${operation.relpath}" (expected: ${operation.hash}, found: ${hash(operation.data)})`);
                        break;
                    }
                }
            }

            this.emit('prepare_finish');
            this.emit('execute_start');

            // All operations have been prepared and validated, so execute them now
            checkResult.operations.forEach(operation => {
                switch (operation.type) {
                    case 'update': {
                        this.emit('install_start', operation.relpath);
                        try {
                            forcedirSync(path.dirname(operation.abspath));
                            fs.writeFileSync(operation.abspath, operation.data);
                            this.emit('install_finish', operation.relpath);
                        } catch (e) {
                            success = false;
                            this.emit('install_error', operation.relpath, e);
                        }
                        break;
                    }
                }
            });

            this.emit('execute_finish');
        }

        this.emit('run_finish', success);
        return checkResult.operations.length !== 0;
    }
}

module.exports = Updater;
