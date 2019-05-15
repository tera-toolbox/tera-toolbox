async function updateSelf() {
    delete require.cache[require.resolve('./update-self')];
    const autoUpdateSelf = require("./update-self");
    let result = await autoUpdateSelf(console);
    if (result)
        return updateSelf();
    else
        return true;
}

updateSelf().then((result) => {
    if (result) {
        require("./loader-cli");
    } else {
        console.log("Failed to auto-update TERA Toolbox!");
    }
}).catch((e) => {
    if (e instanceof TypeError) {
        console.log('An update is ready. Please restart TERA Toolbox if it does not do so automatically!');
    } else {
        console.log('Failed to auto-update TERA Toolbox:');
        console.log(e);
    }
});
