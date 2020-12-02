function checkRuntimeCompatibility() {
    if (process.versions.electron === undefined) {
        // We're on Node.JS
        if (process.versions.modules < 85)
            throw new Error('NodeTooOld');
    } else {
        // We're on Electron
        if (process.versions.modules < 83)
            throw new Error('NodeTooOld');
    }

    return true;
}

async function initGlobalSettings(DevMode = false) {
    global.TeraProxy = {
        DevMode: !!DevMode,
        DiscordUrl: 'https://discord.gg/dUNDDtw',
        SupportUrl: 'https://discord.gg/659YbNY',
        GUIMode: !!process.versions.electron,
        IsAdmin: await isAdmin(),
        get UILanguage() {
            console.warn('Accessing deprecated "global.TeraProxy.UILanguage", use "require(\'tera-toolbox-mui\').language" instead! Stack:');
            console.warn(new Error().stack);
            return require('tera-toolbox-mui').language;
        },
    };
}

function setHighestProcessPriority() {
    const os = require('os');
    os.setPriority(os.constants.priority.PRIORITY_ABOVE_NORMAL);
}

function setNormalProcessPriority() {
    const os = require('os');
    os.setPriority(os.constants.priority.PRIORITY_NORMAL);
}

// See https://github.com/sindresorhus/is-admin
function isAdmin() {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
        exec('fsutil dirty query %systemdrive%', (err, so, se) => {
            if (!err) {
                resolve(true);
            } else {
                if (err.code === 1)
                    resolve(false);
                else
                    reject(err);
            }
        });
    });
}

/**
 * Remove directory recursively
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
function rimraf(dir_path) {
    const fs = require('fs');
    const path = require('path'); 
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

module.exports = { checkRuntimeCompatibility, initGlobalSettings, setNormalProcessPriority, setHighestProcessPriority, isAdmin, rimraf };
