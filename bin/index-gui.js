const DiscordURL = 'https://discord.gg/659YbNY';

const { app } = require('electron');
const path = require('path');

// Utility
function dialogAndQuit(data) {
    const { dialog } = require('electron');
    dialog.showMessageBox(data);
    app.exit();
}

// Splash Screen
let SplashScreen = null;
let SplashScreenShowTime = 0;

function showSplashScreen() {
    try {
        const guiRoot = path.join(__dirname, 'gui');
        const guiIcon = path.join(guiRoot, 'icon.ico');

        const { BrowserWindow } = require('electron');
        SplashScreen = new BrowserWindow({
            title: 'TERA Toolbox',
            width: 960,
            height: 540,
            icon: guiIcon,
            frame: false,
            backgroundColor: '#292F33',
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                devTools: false
            }
        });

        SplashScreen.loadFile(path.join(guiRoot, 'splash.html'));
        SplashScreen.show();
        SplashScreenShowTime = Date.now();
    } catch (e) {
        // Ignore any error resulting from splash screen
        SplashScreen = null;
    }
}

function hideSplashScreen(onDone) {
    setTimeout(() => {
        onDone();

        if (SplashScreen) {
            SplashScreen.close();
            SplashScreen = null;
        }
    }, SplashScreen ? Math.max(0, 1500 - (Date.now() - SplashScreenShowTime)) : 0);
}

function setSplashScreenCaption(caption) {
    if (SplashScreen)
        SplashScreen.webContents.send('caption', caption);
}

function setSplashScreenInfo(info) {
    if (SplashScreen)
        SplashScreen.webContents.send('info', info);
}

// Update
async function updateSelf() {
    delete require.cache[require.resolve('./update-self')];
    const Updater = require('./update-self');

    let error = null;

    const updater = new Updater(branch);
    updater.on('run_start', () => {
        console.log(`[update] Self-update started (Branch: ${updater.branch})`);

        setSplashScreenCaption('Running self-update...');
        setSplashScreenInfo('');
    });

    updater.on('check_start', (serverIndex) => {
        if (updatelog)
            console.log(`[update] Update check started (Server: ${serverIndex})`);

        setSplashScreenCaption('Checking for updates...');
        setSplashScreenInfo(`Server ${serverIndex}`);
    });
    updater.on('check_success', (serverIndex, operations) => {
        if (updatelog)
            console.log(`[update] Update check finished (Server: ${serverIndex}), ${operations.length} operations required`);

        setSplashScreenCaption('Update check finished!');
        setSplashScreenInfo(`Server ${serverIndex}`);
    });
    updater.on('check_fail', (serverIndex, e) => {
        console.log(`[update] Update check failed (Server: ${serverIndex}): ${e}`);

        setSplashScreenCaption(`Update check finished (server ${serverIndex})!`);
    });
    updater.on('check_fail_all', () => {
        error = `TERA Toolbox was unable to check for updates. Please ask in ${DiscordURL} for help!\n>> MAKE SURE TO READ THE CHANNEL DESCRIPTION FIRST <<\n\nThe program will now be terminated.`;
        console.log('[update] Update check failed');

        setSplashScreenCaption('Update check failed!');
    });

    updater.on('prepare_start', () => {
        if (updatelog)
            console.log(`[update] Update download and preparation started`);

        setSplashScreenCaption('Preparing update...');
        setSplashScreenInfo('');
    });
    updater.on('download_start', (serverIndex, relpath) => {
        if (updatelog)
            console.log(`[update] - Download: ${relpath} (Server: ${serverIndex})`);

        setSplashScreenCaption(`Downloading update (server ${serverIndex})...`);
        setSplashScreenInfo(relpath);
    });
    updater.on('prepare_finish', () => {
        if (updatelog)
            console.log(`[update] Update download and preparation finished`);

        setSplashScreenCaption('Update prepared!');
        setSplashScreenInfo('');
    });

    updater.on('execute_start', () => {
        if (updatelog)
            console.log(`[update] Update installation started`);

        setSplashScreenCaption('Installing update...');
        setSplashScreenInfo('');
    });
    updater.on('install_start', (relpath) => {
        if (updatelog)
            console.log(`[update] - Install: ${relpath}`);

        setSplashScreenCaption('Installing update...');
        setSplashScreenInfo(relpath);
    });
    updater.on('install_error', (relpath, e) => {
        console.log(`[update] - Error installing ${relpath}: ${e}`);
        switch (relpath) {
            case 'node_modules/tera-client-interface/injector.exe':
                console.log('[update] - Your anti-virus software most likely falsely detected it to be a virus.');
                console.log('[update] - Please whitelist TERA Toolbox in your anti-virus!');
                console.log(`[update] - For further information, check the #toolbox-faq channel in ${DiscordURL}!`);
                break;
            case 'node_modules/tera-client-interface/tera-client-interface.dll':
                console.log('[update] - This is most likely caused by an instance of the game that is still running.');
                console.log('[update] - Close all game clients or restart your computer, then try again!');
                break;
        }

        setSplashScreenCaption('Error installing update!');
        setSplashScreenInfo(relpath);

        switch (relpath) {
            case 'node_modules/tera-client-interface/injector.exe':
                error = `TERA Toolbox was unable to update itself.\nYour anti-virus software most likely falsely detected it to be a virus.\nPlease whitelist TERA Toolbox in your anti-virus!\nCheck the #toolbox-faq channel in ${DiscordURL} for further information.\n\nThe full error message is:\nUnable to install "${relpath}"!\n${e}\n\nThe program will now be terminated.`;
                break;
            case 'node_modules/tera-client-interface/tera-client-interface.dll':
                error = `TERA Toolbox was unable to update itself.\nThis is most likely caused by an instance of the game that is still running.\nClose all game clients or restart your computer, then try again!\n\nThe full error message is:\nUnable to install "${relpath}"!\n${e}\n\nThe program will now be terminated.`;
                break;
            default:
                error = `TERA Toolbox was unable to update itself. Please ask in ${DiscordURL} for help!\n>> MAKE SURE TO READ THE CHANNEL DESCRIPTION FIRST <<\n\nThe full error message is:\nUnable to install "${relpath}"!\n${e}\n\nThe program will now be terminated.`;
                break;
        }
    });
    updater.on('execute_finish', () => {
        if (updatelog)
            console.log(`[update] Update installation finished`);

        setSplashScreenCaption('Update installed!');
        setSplashScreenInfo('');
    });

    updater.on('run_finish', (success) => {
        console.log(`[update] Self-update ${success ? 'finished' : 'failed'}`);

        setSplashScreenCaption(`Self-update ${success ? 'finished' : 'failed'}!`);
        setSplashScreenInfo('');
    });

    const filesChanged = await updater.run();
    if (error)
        return error;
    if (filesChanged)
        return await updateSelf();
    return null;
}

// Main function
function run() {
    require('./loader-gui');
}

function main() {
    if (noselfupdate) {
        run();
    } else {
        // Show splash screen
        showSplashScreen();

        // Perform self-update
        updateSelf().then(e => {
            if (e) {
                dialogAndQuit({
                    type: 'error',
                    title: 'Self-update error!',
                    message: e
                });
            } else {
                const { updateRequired, update } = require('./update-electron.js');
                if (updateRequired()) {
                    setSplashScreenCaption('Downloading Electron update...');
                    setSplashScreenInfo('');

                    update().then(() => {
                        app.exit();
                    }).catch(e => {
                        dialogAndQuit({
                            type: 'error',
                            title: 'Electron update error!',
                            message: `TERA Toolbox was unable to update Electron. Please ask in ${DiscordURL} for help!\n>> MAKE SURE TO READ THE CHANNEL DESCRIPTION FIRST <<\n\nThe full error message is:\n${e}\n\nThe program will now be terminated.`
                        });
                    });
                } else {
                    hideSplashScreen(() => {
                        run();
                    });
                }
            }
        }).catch(e => {
            dialogAndQuit({
                type: 'error',
                title: 'Self-update error!',
                message: `TERA Toolbox was unable to update itself. Please ask in ${DiscordURL} for help!\n>> MAKE SURE TO READ THE CHANNEL DESCRIPTION FIRST <<\n\nThe full error message is:\n${e}\n\nThe program will now be terminated.`
            });
        });
    }
}

// -------------------------------------------------------------------
// Safely load configuration
let branch = 'master';
let updatelog = false;
let noselfupdate = false;
try {
    const config = require('./config').loadConfig();
    if (config) {
        if (config.branch)
            branch = config.branch.toLowerCase();
        updatelog = !!config.updatelog;
        noselfupdate = !!config.noselfupdate;
    }
} catch (_) {
    console.warn('[update] WARNING: An error occurred while trying to read the config file! Falling back to default values.');
}

// Boot
if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
if (app.isReady())
    main();
else
    app.on('ready', main);
