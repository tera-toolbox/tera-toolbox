const DiscordURL = "https://discord.gg/dUNDDtw";

// Check node/electron version
let BigIntSupported = false;
try { BigIntSupported = eval('1234n === 1234n'); } catch (_) {}

if(['11.0.0', '11.1.0'].includes(process.versions.node)) {
  console.error('ERROR: Node.JS 11.0 and 11.1 contain a critical bug preventing timers from working properly. Please install version 11.2 or later!');
  process.exit();
} else if(process.versions.modules < 64 || !BigIntSupported) {
  if(!!process.versions.electron) {
    console.error('ERROR: Your version of Electron is too old to run tera-proxy!');
    console.error('ERROR: If you are using Arborean Apparel, download the latest release from:');
    console.error('ERROR: https://github.com/iribae/arborean-apparel/releases');
    console.error('ERROR: Otherwise, please ask in the #help channel of %s!', DiscordURL);
  } else {
    console.error('ERROR: Your installed version of Node.JS is too old to run tera-proxy!');
    console.error('ERROR: Please install the latest version from https://nodejs.org/en/download/current/');
  }
  process.exit();
}

// Load and validate configuration
const {region: REGION, updatelog: UPDATE_LOG, dnsservers: DNS_SERVERS} = (() => {
    try {
        return require("../config.json");
    } catch(_) {
        console.log("ERROR: Whoops, looks like you've fucked up your config.json!");
        console.log("ERROR: Try to fix it yourself or ask in the #help channel of %s!", DiscordURL);
        process.exit(1);
    }
})();

const REGIONS = require("./regions");
const currentRegion = REGIONS[REGION];
if (!currentRegion) {
  console.error("Invalid region: " + REGION);
  return;
}

const REGION_SHORT = REGION.toLowerCase().split('-')[0];
const isConsole = currentRegion["console"];
const { customServers, listenHostname, hostname } = currentRegion;
const altHostnames = currentRegion.altHostnames || [];
const fs = require("fs");
const path = require("path");
const ModuleFolder = path.join(__dirname, "..", "node_modules");

// Region migration
let migratedFile = null;
switch(REGION) {
 case "EU": {
   if (currentRegion.customServers["30"] || currentRegion.customServers["31"] || currentRegion.customServers["32"] || currentRegion.customServers["33"] || currentRegion.customServers["34"] || currentRegion.customServers["35"])
     migratedFile = "res/servers-eu.json";
   break;
 }
 case "TH": {
   if (currentRegion.customServers["2"] || !currentRegion.customServers["1"])
     migratedFile = "res/servers-th.json";
   break;
 }
 case "JP": {
   if (!currentRegion.customServers["5073"])
     migratedFile = "res/servers-jp.json";
   break;
 }
}

if (migratedFile) {
 try {
   fs.unlinkSync(path.join(__dirname, migratedFile));
   console.log(`Due to a change in the server list by the publisher, your server configuration for region ${REGION} was reset. Please restart proxy for the changes to take effect!`);
 } catch (e) {
   console.log(`ERROR: Unable to migrate server list for region ${REGION}: ${e}`);
 }
 return;
}

// No migration required
console.log(`[sls] Tera-Proxy configured for region ${REGION}!`);

let why;
try { why = require("why-is-node-running"); }
catch (_) {}

const net = require("net");
const dns = require("dns");
const hosts = require("./hosts");

if (!isConsole) {
  try {
    hosts.remove(listenHostname, hostname);
    for (let x of altHostnames)
      hosts.remove(listenHostname, x);
  } catch (e) {
    switch (e.code) {
     case "EACCES":
      console.error(`ERROR: Hosts file is set to read-only.

  * Make sure no anti-virus software is running.
  * Locate "${e.path}", right click the file, click 'Properties', uncheck 'Read-only' then click 'OK'.`);
      break;
     case "EBUSY":
      console.error(`ERROR: Hosts file is busy and cannot be written to.

  * Make sure no anti-virus software is running.
  * Try deleting "${e.path}".`);
      break;
     case "EPERM":
      console.error(`ERROR: Insufficient permission to modify hosts file.

  * Make sure no anti-virus software is running.
  * Right click TeraProxy.bat and select 'Run as administrator'.`);
      break;
     case "ENOENT":
      console.error(`ERROR: Unable to write to hosts file.

  * Make sure no anti-virus software is running.
  * Right click TeraProxy.bat and select 'Run as administrator'.`);
      break;
     default:
      throw e;
    }

    return;
  }
}

const servers = new Map();

function customServerCallback(server) {
  const { address, port } = server.address();
  console.log(`[game] listening on ${address}:${port}`);
}

function listenHandler(err) {
  if (err) {
    const { code } = err;
    if (code === "EADDRINUSE") {
      console.error("ERROR: Another instance of TeraProxy is already running, please close it then try again.");
      process.exit();
    }
    else if (code === "EACCES") {
      let port = currentRegion.port;
      console.error("ERROR: Another process is already using port " + port + ".\nPlease close or uninstall the application first:");
      return require("./netstat")(port);
    }
    throw err;
  }

  if (!isConsole) {
    hosts.set(listenHostname, hostname);
    for (let x of altHostnames)
      hosts.set(listenHostname, x);

    console.log("[sls] server list overridden");
  }

  for (let i = servers.entries(), step; !(step = i.next()).done; ) {
    const [id, server] = step.value;
    const currentCustomServer = customServers[id];

    server.listen(currentCustomServer.port, currentCustomServer.ip || "127.0.0.1", customServerCallback.bind(null, server));
  }
}

let lastUpdateResult = {"protocol_data": {}, "failed": [], "legacy": [], "updated": []};

function onConnectionError(err) {
  switch(err.code) {
    case 'ETIMEDOUT':
      console.error(`ERROR: Unable to connect to game server at ${err.address}:${err.port} (timeout)! Common reasons for this are:`);
      console.error("- An unstable internet connection or a geo-IP ban");
      console.error("- Game server maintenance");
      break;
    case 'ECONNRESET':
    case 'EPIPE':
      console.error(`ERROR: ${err.code} - Connection to game server was closed unexpectedly. Common reasons for this are:`);
      console.error("- A disconnect caused by an unstable internet connection");
      console.error("- An exploit/cheat or broken module that got you kicked");
      break;
    default:
      console.warn(err);
      break;
  }
}

let activeConnections = new Set;

function runServ(target, socket) {
  const { Connection, RealClient } = require("tera-proxy-game");

  const connection = new Connection(ModuleFolder, {
    "region": REGION_SHORT,
    "console": !!isConsole,
    "classic": !!currentRegion["classic"],
    "protocol_data": lastUpdateResult["protocol_data"],
  });
  const client = new RealClient(connection, socket);
  const srvConn = connection.connect(client, {
    host: target.ip,
    port: target.port
  });

  connection.dispatch.moduleManager.loadAll();

  // Initialize server connection
  let remote = "???";

  socket.on("error", onConnectionError);

  srvConn.on("connect", () => {
    remote = socket.remoteAddress + ":" + socket.remotePort;
    console.log("[connection] routing %s to %s:%d", remote, srvConn.remoteAddress, srvConn.remotePort);

    activeConnections.add(connection);
  });

  srvConn.on("error", (err) => {
    onConnectionError(err);
    activeConnections.delete(connection);
  });

  srvConn.on("close", () => {
    console.log("[connection] %s disconnected", remote);
    activeConnections.delete(connection);
  });
}

const autoUpdate = require("./update");

function createServ(target, socket) {
  socket.setNoDelay(true);
  runServ(target, socket);
}

const SlsProxy = require("tera-proxy-sls");
const proxy = new SlsProxy(currentRegion);

function startProxy() {
  if(!isConsole) {
    dns.setServers(DNS_SERVERS || ["8.8.8.8", "8.8.4.4"]);

    // For some reason, node's http request timeout doesn't always work, so add a workaround here.
    let slsTimeout = setTimeout(() => {
      console.error("ERROR: Timeout while trying to load the server list.");
      console.error("This is NOT a proxy issue. Your connection to the official servers is not working properly!");
      console.error("Try restarting/resetting your router and your computer. That might solve the issue.");
      process.exit(1);
    }, 5000);

    proxy.fetch((err, gameServers) => {
      if (err) {
        console.error(`ERROR: Unable to load the server list: ${err}`);
        console.error("This is almost always caused by");
        console.error(" - your setup (invasive virus scanners, viruses, ...)");
        console.error(" - your internet connection (unstable/broken connection, improper configuration, geo-IP ban from the game region you're trying to play on, ...)");
        console.error(" - game servers being down for maintenance");
        console.error("Please test if you can regularly play the game (without proxy). If you can't, it's not a proxy issue, but one of the above.");
        console.error("You can also try restarting/resetting your router and your computer.");
        process.exit(1);
      }

      for (let i = 0, arr = Object.keys(customServers), len = arr.length; i < len; ++i) {
        const id = arr[i];
        const target = gameServers[id];
        if (!target) {
          console.error(`[sls] WARNING: Server ${id} not found`);
          continue;
        }

        const server = net.createServer(createServ.bind(null, target));
        servers.set(id, server);
      }

      proxy.listen(listenHostname, listenHandler);
      clearTimeout(slsTimeout);
    });
  } else {
    for (let i = 0, arr = Object.keys(customServers), len = arr.length; i < len; ++i) {
      const id = arr[i];
      const target = customServers[id]["remote"];

      const server = net.createServer(createServ.bind(null, target));
      servers.set(id, server);
    }

    listenHandler();
  }

  // TODO: this is a dirty hack, implement this stuff properly
  for (let mod of lastUpdateResult["updated"]) {
    if (mod.options.loadOn === "startup") {
      console.log(`[proxy] Initializing module ${mod.name}`);
      require(mod.name)(REGION_SHORT);
    }
  }
}

autoUpdate(ModuleFolder, UPDATE_LOG, true, REGION_SHORT).then((updateResult) => {
  for (let mod of updateResult["legacy"])
    console.log("[update] WARNING: Module %s does not support auto-updating!", mod.name);
  for (let mod of updateResult["failed"])
    console.log("[update] ERROR: Module %s could not be updated and might be broken!", mod.name);
  if(!updateResult["tera-data"])
    console.log("[update] ERROR: There were errors updating tera-data. This might result in further errors.");

  delete require.cache[require.resolve("tera-data-parser")];
  delete require.cache[require.resolve("tera-proxy-game")];

  lastUpdateResult = updateResult;
  startProxy();
}).catch((e) => {
  console.log("ERROR: Unable to auto-update: %s", e);
})

const isWindows = process.platform === "win32";

function cleanExit() {
  console.log("terminating...");

  activeConnections.forEach((connection) => { connection.close(); });
  activeConnections.clear();

  if(!isConsole) {
    try {
      hosts.remove(listenHostname, hostname);
      for (let x of altHostnames)
        hosts.remove(listenHostname, x);
    }
    catch (_) {}

    proxy.close();
  }

  for (let i = servers.values(), step; !(step = i.next()).done; )
    step.value.close();

  if (isWindows) {
    process.stdin.pause();
  }

  setTimeout(() => {
    why && why();
    process.exit();
  }, 5000).unref();
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
