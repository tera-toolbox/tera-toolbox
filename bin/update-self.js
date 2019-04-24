// Imports
let request = null;
try {
    request = require('request-promise-native');
} catch (_) {
    // Ignore
}

const crypto = require('crypto');
const fs = require("fs");
const path = require("path");

// Constants
const TeraProxyAutoUpdateServers = ["https://raw.githubusercontent.com/tera-toolbox/tera-toolbox/", "https://teralogs.lima-city.de/proxy/"];
const DiscordURL = "https://discord.gg/dUNDDtw";

// Safely load configuration
let branch = 'master';
let updatelog = false;
let disableSelfUpdate = false;
try {
    const config = require("./config").loadConfig();
    if (config) {
        if (config.branch)
            branch = config.branch.toLowerCase();
        updatelog = !!config.updatelog;
        disableSelfUpdate = !!config.noselfupdate;
    }
} catch (_) {
    // Ignore
}

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
    return crypto.createHash("sha256").update(data).digest().toString("hex").toUpperCase();
}

async function autoUpdateFile(file, filepath, url, expectedHash = null) {
    try {
        const updatedFile = await request({ url: url, encoding: null });

        if (expectedHash && expectedHash !== hash(updatedFile))
            throw new Error(`ERROR: ${url}\nDownloaded file doesn't match hash specified in patch manifest!`);

        forcedirSync(path.dirname(filepath));
        fs.writeFileSync(filepath, updatedFile);
        return [file, true];
    } catch (e) {
        return [file, false];
    }
}

async function autoUpdateSelf(outputConsole, updatelimit = true, serverIndex = 0) {
    if (!outputConsole)
        outputConsole = console;

    if (!request) {
        outputConsole.error("ERROR: It looks like you've downloaded TERA Toolbox directly from GitHub without properly installing required dependencies!");
        outputConsole.error("ERROR: Please join %s and download the prepackaged release version from the #toolbox channel!", DiscordURL);
        return Promise.reject("Request not installed");
    }

    if (disableSelfUpdate) {
        outputConsole.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        outputConsole.warn("!!!!!       YOU HAVE DISABLED AUTOMATIC SELF-UPDATING       !!!!!");
        outputConsole.warn("!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
        outputConsole.warn("!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
        outputConsole.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return false;
    }

    if (serverIndex === 0)
        outputConsole.log(`[update] Self-update started (Branch: ${branch})`);

    try {
        const manifest = await request({ url: TeraProxyAutoUpdateServers[serverIndex] + branch + '/manifest.json', json: true });
        if (!manifest["files"])
            throw new Error("Invalid manifest!");

        let promises = [];
        for (let file in manifest["files"]) {
            let filepath = path.join(__dirname, "..", file);
            let filedata = manifest["files"][file];
            let needsUpdate = !fs.existsSync(filepath);
            let expectedHash = null;

            if (!needsUpdate) {
                if (typeof filedata === 'object') {
                    expectedHash = filedata["hash"].toUpperCase();
                    needsUpdate = filedata["overwrite"] && (hash(fs.readFileSync(filepath)) !== expectedHash);
                } else {
                    expectedHash = filedata.toUpperCase();
                    needsUpdate = (hash(fs.readFileSync(filepath)) !== expectedHash);
                }
            }

            if (needsUpdate) {
                if (updatelog)
                    outputConsole.log("[update] - Download " + file);
                let promise = autoUpdateFile(file, filepath, TeraProxyAutoUpdateServers[serverIndex] + branch + '/' + file, expectedHash);
                promises.push(updatelimit ? (await promise) : promise);
            }
        }

        let results = updatelimit ? promises : (await Promise.all(promises));
        if (results.length > 0) {
            let failedFiles = [];
            for (let result of results) {
                if (!result[1])
                    failedFiles.push(result[0]);
            }

            if (failedFiles.length > 0)
                throw "Failed to update the following files:\n - " + failedFiles.join('\n - ');

            outputConsole.log(`[update] TERA Toolbox updated (Update server ${serverIndex})!`);
            return true;
        } else {
            outputConsole.log(`[update] TERA Toolbox is up to date (Update server ${serverIndex})!`);
            return false;
        }
    } catch (e) {
        outputConsole.error(`ERROR: Unable to self-update (Update server ${serverIndex}):\n${e}\n`);

        if (e.code === 'UNKNOWN')
            return Promise.reject(e);

        if (serverIndex + 1 < TeraProxyAutoUpdateServers.length) {
            outputConsole.log('Attempting to use next update server...\n');
            return autoUpdateSelf(outputConsole, updatelimit, serverIndex + 1);
        } else {
            outputConsole.error(`ERROR: Unable to perform self-update!:\n${e}\n\nPlease join ${DiscordURL} and check the #info and #help channels for further instructions.`);
            return Promise.reject(e);
        }
    }
}

module.exports = autoUpdateSelf;
