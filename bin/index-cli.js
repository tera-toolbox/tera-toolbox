const DiscordURL = 'https://discord.gg/659YbNY';

// Update
async function updateSelf() {
    delete require.cache[require.resolve('./update-self')];
    const Updater = require('./update-self');

    const updater = new Updater(branch);
    updater.on('run_start', () => { console.log(`[update] Self-update started (Branch: ${updater.branch})`) });
    updater.on('check_start', (serverIndex) => { if (updatelog) console.log(`[update] Update check started (Server: ${serverIndex})`) });
    updater.on('check_success', (serverIndex, operations) => { if (updatelog) console.log(`[update] Update check finished (Server: ${serverIndex}), ${operations.length} operations required`) });
    updater.on('check_fail', (serverIndex, error) => { console.log(`[update] Update check failed (Server: ${serverIndex}): ${error}`) });
    updater.on('check_fail_all', () => { console.log(`[update] Update check failed`) });
    updater.on('prepare_start', () => { if (updatelog) console.log(`[update] Update download and preparation started`) });
    updater.on('download_start', (serverIndex, relpath) => { if (updatelog) console.log(`[update] - Download: ${relpath} (Server: ${serverIndex})`) });
    //updater.on('download_finish', (serverIndex, relpath) => { if (updatelog) console.log(`[update] - Download done: ${relpath} (Server: ${serverIndex})`) });
    updater.on('prepare_finish', () => { if (updatelog) console.log(`[update] Update download and preparation finished`) });
    updater.on('execute_start', () => { if (updatelog) console.log(`[update] Update installation started`) });
    updater.on('install_start', (relpath) => { if (updatelog) console.log(`[update] - Install: ${relpath}`) });
    //updater.on('install_finish', (relpath) => { if (updatelog) console.log(`[update] - Install done: ${relpath}`) });
    updater.on('execute_finish', () => { if (updatelog) console.log(`[update] Update installation finished`) });
    updater.on('run_finish', () => { console.log(`[update] Self-update finished`) });

    const filesChanged = await updater.run();
    if (filesChanged)
        await updateSelf();
}

// Main function
function run() {
    require('./loader-cli');
}

function main() {
    if (noselfupdate) {
        console.warn("[toolbox] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.warn("[toolbox] !!!!!       YOU HAVE DISABLED AUTOMATIC SELF-UPDATING       !!!!!");
        console.warn("[toolbox] !!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
        console.warn("[toolbox] !!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
        console.warn("[toolbox] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        run();
    } else {
        updateSelf().then(() => {
            run();
        }).catch(e => {
            console.error('[update] ERROR: Unable to perform self-update!');
            console.error(`[update] ERROR: Please join ${DiscordURL} and check the #info and #help channels for further instructions.`);
            console.error('[update] ERROR: The full error message is:');
            console.error('-----------------------------------------------');
            console.error(e);
            console.error('-----------------------------------------------');
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
main();
