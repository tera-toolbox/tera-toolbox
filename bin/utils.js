function checkRuntimeCompatibility() {
    let BigIntSupported = false;
    try { BigIntSupported = eval('1234n === 1234n'); } catch (_) { }

    if (['11.0.0', '11.1.0', '11.2.0', '11.3.0'].includes(process.versions.node))
        throw new Error('Node.JS 11.0 to 11.3 contain critical bugs preventing timers from working properly. Please install version 11.4 or later!');
    else if (process.versions.modules < 64 || !BigIntSupported)
        throw new Error('BigInt not supported');

    return true;
}

function initGlobalSettings(DevMode = false) {
    global.TeraProxy = {
        DevMode: !!DevMode,
        DiscordUrl: 'https://discord.gg/dUNDDtw',
        SupportUrl: 'https://discord.gg/659YbNY',
        GUIMode: !!process.versions.electron,
    };
}

module.exports = { checkRuntimeCompatibility, initGlobalSettings };
