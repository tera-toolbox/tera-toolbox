let request = null;
try {
  request = require('request-promise-native');
} catch(_) { }

const crypto = require('crypto');
const fs = require("fs");
const path = require("path");

const TeraProxyAutoUpdateServers = ["https://raw.githubusercontent.com/hackerman-caali/tera-proxy/master/", "http://teralogs.feedia.co/proxy/", "https://teralogs.lima-city.de/proxy/"];
const DiscordURL = "https://tinyurl.com/caaliproxy";

function forcedirSync(dir) {
  const sep = path.sep;
  const initDir = path.isAbsolute(dir) ? sep : '';
  dir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {

    }

    return curDir;
  }, initDir);
}

async function autoUpdateFile(file, filepath, url) {
  try {
    const updatedFile = await request({url: url, encoding: null});

    forcedirSync(path.dirname(filepath));
    fs.writeFileSync(filepath, updatedFile);
    return [file, true];
  } catch (e) {
    return [file, false];
  }
}

async function autoUpdateSelf(updatelimit = true, serverIndex = 0) {
  if(!request) {
    console.error("ERROR: It looks like you've downloaded my proxy directly from GitHub without properly installing required dependencies!");
    console.error("ERROR: Please join %s and download the prepackaged release version from the #proxy channel!", DiscordURL);
    return Promise.reject("Request not installed");
  }

  try {
    const manifest = await request({url: TeraProxyAutoUpdateServers[serverIndex] + 'manifest.json', json: true});
    if(!manifest["files"])
      throw "Invalid manifest!";

    let promises = [];
    for(let file in manifest["files"]) {
      let filepath = path.join(__dirname, "..", "..", file);
      let filedata = manifest["files"][file];
      let needsUpdate = !fs.existsSync(filepath);
      if(!needsUpdate) {
        if(typeof filedata === 'object') {
          needsUpdate = filedata["overwrite"] && (crypto.createHash("sha256").update(fs.readFileSync(filepath)).digest().toString("hex").toUpperCase() !== filedata["hash"].toUpperCase());
        } else {
          needsUpdate = (crypto.createHash("sha256").update(fs.readFileSync(filepath)).digest().toString("hex").toUpperCase() !== filedata.toUpperCase());
        }
      }
      if(needsUpdate) {
        let promise = autoUpdateFile(file, filepath, TeraProxyAutoUpdateServers[serverIndex] + file);
        promises.push(updatelimit ? (await promise) : promise);
      }
    }

    let results = updatelimit ? promises : (await Promise.all(promises));
    if(results.length > 0)
    {
      let failedFiles = [];
      for(let result of results) {
        if(!result[1])
          failedFiles.push(result[0]);
      }

      if(failedFiles.length > 0)
        throw "Failed to update the following proxy files:\n - " + failedFiles.join('\n - ');

      console.log(`[update] Proxy updated (Update server ${serverIndex})!`);
      return true;
    } else {
      console.log(`[update] Proxy is up to date (Update server ${serverIndex})!`);
      return false;
    }
  } catch(e) {
    if(serverIndex + 1 < TeraProxyAutoUpdateServers.length) {
      return autoUpdateSelf(updatelimit, serverIndex + 1);
    } else {
      console.error("ERROR: Unable to auto-update the proxy!: %s\nPlease join %s and check the #info and #help channels for further instructions.", e, DiscordURL);
      return Promise.reject(e);
    }
  }
}

module.exports = autoUpdateSelf;
