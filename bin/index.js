async function updateSelf() {
    delete require.cache[require.resolve('./update-self')];
    const autoUpdateSelf = require("./update-self");
    try {
        let result = await autoUpdateSelf();
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
        try {
            // Preparation for smooth migration to new boot sequence
            require(process.versions.electron ? './index-gui' : './index-cli');
        } catch (_) {
            require("./loader");
        }
    } else {
        console.log("Failed to auto-update the proxy, terminating...");
    }
});
