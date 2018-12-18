function RunProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig) {
    const TeraProxy = require('./proxy');
    let proxy = new TeraProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
    try {
        proxy.run();
    } catch (_) {
        console.error('[proxy] Unable to start proxy, terminating...');
        process.exit();
    }

    // Set up clean exit
    const isWindows = process.platform === "win32";

    function cleanExit() {
        console.log("terminating...");

        proxy.destructor();
        proxy = null;

        if (isWindows)
            process.stdin.pause();
    }

    if (isWindows) {
        require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        }).on("SIGINT", () => process.emit("SIGINT"));
    }

    process.on("SIGHUP", cleanExit);
    process.on("SIGINT", cleanExit);
    process.on("SIGTERM", cleanExit);
}

module.exports = function LoaderConsole(ModuleFolder, ProxyConfig, ProxyRegionConfig) {
    global.TeraProxy.GUIMode = false;

    // Auto-update modules & tera-data and run
    if (ProxyConfig.noupdate) {
        console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.warn("!!!!!      YOU HAVE GLOBALLY DISABLED AUTOMATIC UPDATES     !!!!!");
        console.warn("!!!!! THERE WILL BE NO SUPPORT FOR ANY KIND OF PROBLEM THAT !!!!!");
        console.warn("!!!!!      YOU MIGHT ENCOUNTER AS A RESULT OF DOING SO      !!!!!");
        console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        RunProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
    } else {
        const autoUpdate = require("./update");
        autoUpdate(ModuleFolder, ProxyConfig.updatelog, true, ProxyRegionConfig.idShort).then(updateResult => {
            for (let mod of updateResult["legacy"])
                console.log("[update] WARNING: Module %s does not support auto-updating!", mod.name);
            for (let mod of updateResult["failed"])
                console.log("[update] ERROR: Module %s could not be updated and might be broken!", mod.name);
            if (!updateResult["tera-data"])
                console.log("[update] ERROR: There were errors updating tera-data. This might result in further errors.");

            delete require.cache[require.resolve("tera-data-parser")];
            delete require.cache[require.resolve("tera-proxy-game")];

            RunProxy(ModuleFolder, ProxyConfig, ProxyRegionConfig);
        }).catch(e => {
            console.log("ERROR: Unable to auto-update: %s", e);
        });
    }
};
