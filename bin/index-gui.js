const DiscordURL = 'https://discord.gg/659YbNY';

const { app } = require('electron');
const path = require('path');

// Utility
function dialogAndQuit(data) {
    const { dialog } = require('electron');
    dialog.showMessageBox(data);
    app.quit();
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
    updater.on('check_fail', (serverIndex, error) => {
        console.log(`[update] Update check failed (Server: ${serverIndex}): ${error}`);

        setSplashScreenCaption(`Update check finished (server ${serverIndex})!`);
    });
    updater.on('check_fail_all', () => {
        console.log('[update] Update check failed');

        setSplashScreenCaption('Update check failed!');
        dialogAndQuit({
            type: 'error',
            title: 'Self-update error!',
            message: `TERA Toolbox was unable to check for updates. Please ask in ${DiscordURL} for help!\n>> MAKE SURE TO READ THE CHANNEL DESCRIPTION FIRST <<\n\nThe program will now be terminated.`
        });
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
    updater.on('install_error', (relpath, error) => {
        if (updatelog)
            console.log(`[update] - Error installing ${relpath}: ${error}`);

        setSplashScreenCaption('Error installing update!');
        setSplashScreenInfo(relpath);

        dialogAndQuit({
            type: 'error',
            title: 'Self-update error!',
            message: `TERA Toolbox was unable to update itself. Please ask in ${DiscordURL} for help!\n>> MAKE SURE TO READ THE CHANNEL DESCRIPTION FIRST <<\n\nThe full error message is:\nUnable to install "${relpath}"!\n${error}\n\nThe program will now be terminated.`
        });
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
    if (filesChanged)
        await updateSelf();
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
        updateSelf().then(() => {
            hideSplashScreen(() => {
                run();
            });
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
