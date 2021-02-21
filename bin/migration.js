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

function tryUninstallMod(name) {
    try {
        const ModuleFolder = path.join(__dirname, '..', 'mods');
        const { listModuleInfos, uninstallModule } = require('tera-mod-management');

        const modInfo = listModuleInfos(ModuleFolder).find(modInfo => modInfo.name === name);
        if (modInfo)
            uninstallModule(modInfo);
    } catch (e) {
        // Ignore
    }
}

// Migrate from old versions
function ToolboxMigration() {
    // Delete legacy servers folder
    rimraf(path.join(__dirname, 'servers'));

    // Delete legacy node_modules folders
    const DeprecatedNodeModules = [
        '.bin',
        'ajv',
        'asn1',
        'assert-plus',
        'asynckit',
        'aws-sign2',
        'aws4',
        'balanced-match',
        'baldera-logger',
        'bcrypt-pbkdf',
        'boom',
        'brace-expansion',
        'bunyan',
        'caseless',
        'co',
        'combined-stream',
        'concat-map',
        'core-util-is',
        'cryptiles',
        'dashdash',
        'delayed-stream',
        'dtrace-provider',
        'ecc-jsbn',
        'eventemitter3',
        'extend',
        'extsprintf',
        'fast-deep-equal',
        'fast-json-stable-stringify',
        'forever-agent',
        'form-data',
        'getpass',
        'glob',
        'har-schema',
        'har-validator',
        'hawk',
        'hoek',
        'http-proxy',
        'http-signature',
        'inflight',
        'inherits',
        'is-typedarray',
        'isstream',
        'jsbn',
        'json-schema',
        'json-schema-traverse',
        'json-stringify-safe',
        'jsprim',
        'lodash',
        'long',
        'mime-db',
        'mime-types',
        'minimatch',
        'minimist',
        'mkdirp',
        'moment',
        'mv',
        'nan',
        'ncp',
        'node-stream-zip',
        'oauth-sign',
        'once',
        'path-is-absolute',
        'performance-now',
        'pify',
        'process-list',
        'punycode',
        'qs',
        'request',
        'request-promise-core',
        'request-promise-native',
        'requires-port',
        'rimraf',
        'safe-buffer',
        'safe-json-stringify',
        'sntp',
        'sshpk',
        'stealthy-require',
        'stringstream',
        'tera-crypto-js',
        'tera-crypto-native',
        'tera-proxy-game',
        'tera-proxy-sls',
        'tough-cookie',
        'tunnel-agent',
        'tweetnacl',
        'uuid',
        'verror',
        'wrappy',
        'xmldom'
    ];

    for (const NodeModule of DeprecatedNodeModules)
        rimraf(path.join(__dirname, '..', 'node_modules', NodeModule));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-data-parser', 'lib', 'sysmsg'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'bin', 'ia32'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'bin', 'x64'));
    rimraf(path.join(__dirname, '..', 'node_modules', 'tera-network-proxy', 'lib', 'connection', 'dispatch'));

    // Delete no longer used files
    tryUnlink(path.join(__dirname, "connectionManager.js"));
    tryUnlink(path.join(__dirname, "index.js"));
    tryUnlink(path.join(__dirname, "loader.js"));
    tryUnlink(path.join(__dirname, "loader-console.js"));
    tryUnlink(path.join(__dirname, "hosts.js"));
    tryUnlink(path.join(__dirname, "netstat.js"));
    tryUnlink(path.join(__dirname, "regions.js"));
    tryUnlink(path.join(__dirname, "update-electron-helper.js"));
    tryUnlink(path.join(__dirname, "gui", "index.html"));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-data-parser', 'lib', 'protocol', 'stream.js'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'injector.exe'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'process-listener.js'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'process-listener-dll-injector.js'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'module.js'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'moduleManager.js'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'tera-client-interface.dll'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'scanner', 'scanner_72.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'scanner', 'scanner_75.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'scanner', 'scanner_76.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-client-interface', 'scanner', 'scanner_79.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'binding.gyp'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'fallback.js'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'main.cpp'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'bin', 'tera_network_crypto_72.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'bin', 'tera_network_crypto_75.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'bin', 'tera_network_crypto_76.node'));
    tryUnlink(path.join(__dirname, '..', 'node_modules', 'tera-network-crypto', 'bin', 'tera_network_crypto_79.node'));

    // Delete no longer used mods
    tryUninstallMod('tera-game-state-helper');
    tryUninstallMod('tcc-stub');
    tryUninstallMod('tcc-chat-link');
    tryUninstallMod('caalistatetracker');
    tryUninstallMod('caalilogger');
}

module.exports = { ToolboxMigration };
