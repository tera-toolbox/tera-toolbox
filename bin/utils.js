function checkRuntimeCompatibility() {
    if (process.versions.electron === undefined) {
        // We're on Node.JS
        if (process.versions.modules < 83)
            throw new Error('NodeTooOld');
    } else {
        // We're on Electron
        if (process.versions.modules < 76)
            throw new Error('NodeTooOld');
    }

    return true;
}

async function initGlobalSettings(DevMode = false, UILanguage = 'en') {
    global.TeraProxy = {
        DevMode: !!DevMode,
        DiscordUrl: 'https://discord.gg/dUNDDtw',
        SupportUrl: 'https://discord.gg/659YbNY',
        GUIMode: !!process.versions.electron,
        UILanguage: UILanguage,
        IsAdmin: await isAdmin(),
    };
}

// See https://stackoverflow.com/questions/37322862/check-if-electron-app-is-launched-with-admin-privileges-on-windows
function isAdmin() {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
        exec('NET SESSION', (err, so, se) => {
            resolve(se.length === 0);
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

module.exports = { checkRuntimeCompatibility, initGlobalSettings, isAdmin, rimraf };
