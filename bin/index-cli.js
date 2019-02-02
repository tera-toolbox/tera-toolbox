async function updateSelf() {
    delete require.cache[require.resolve('./update-self')];
    const autoUpdateSelf = require("./update-self");
    try {
        let result = await autoUpdateSelf(console);
        if (result)
            return updateSelf();
        else
            return true;
    } catch (_) {
        return false;
    }
}

updateSelf().then((result) => {
    if (result) {
        require("./loader-cli");
    } else {
        console.log("Failed to auto-update the proxy!");
    }
});
