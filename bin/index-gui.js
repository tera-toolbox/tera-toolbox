const { app } = require('electron');

// Boot
if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
}

if (app.isReady())
    main();
else
    app.on('ready', () => main());

// Main function
async function updateSelf(outputConsole) {
    delete require.cache[require.resolve('./update-self')];
    const autoUpdateSelf = require("./update-self");
    let result = await autoUpdateSelf(outputConsole);
    if (result)
        return updateSelf(outputConsole);
    else
        return true;
}

function main() {
    updateSelf(console).then(result => {
        if (result) {
            require('./loader-gui');
        } else {
            const { dialog } = require('electron');

            dialog.showMessageBox({
                type: 'error',
                title: 'Self-update error!',
                message: `Tera-Proxy was unable to update itself. Please ask in https://discord.gg/659YbNY for help!\n\nIt will now be terminated.`
            });

            app.quit();
        }
    }).catch(e => {
        const { dialog } = require('electron');

        dialog.showMessageBox({
            type: 'error',
            title: 'Self-update error!',
            message: `Tera-Proxy was unable to update itself. Please ask in https://discord.gg/659YbNY for help!\n\nThe full error message is:\n${e}\n\nProxy will now be terminated.`
        });

        app.quit();
    });
}
