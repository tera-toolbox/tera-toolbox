function checkRuntimeCompatibility() {
    if (process.versions.modules < 72)
        throw new Error('NodeTooOld');

    return true;
}

function initGlobalSettings(DevMode = false, UILanguage = 'en') {
    global.TeraProxy = {
        DevMode: !!DevMode,
        DiscordUrl: 'https://discord.gg/dUNDDtw',
        SupportUrl: 'https://discord.gg/659YbNY',
        GUIMode: !!process.versions.electron,
        UILanguage: UILanguage,
    };
}

module.exports = { checkRuntimeCompatibility, initGlobalSettings };
