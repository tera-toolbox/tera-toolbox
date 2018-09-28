const request = require('request-promise-native');
const crypto = require('crypto');
const fs = require("fs");
const path = require("path");

const TeraDataAutoUpdateServer = "https://raw.githubusercontent.com/hackerman-caali/tera-data/master/";
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

function hash(data) {
  return crypto.createHash("sha256").update(data).digest().toString("hex").toUpperCase();
}

function walkdir(dir, listFiles = true, listDirs = false, listRootDir="") {
  let results = [];
  fs.readdirSync(dir).forEach(function(file) {
    const fullpath = path.join(dir, file);
    const relpath = path.join(listRootDir, file);
    const stat = fs.statSync(fullpath);
    if (stat && stat.isDirectory()) {
      if (listDirs)
        results.push(relpath);
      results = results.concat(walkdir(fullpath, listFiles, listDirs, relpath));
    } else {
      if (listFiles)
        results.push(relpath);
    }
  });
  return results;
}

async function autoUpdateFile(file, filepath, url, drmKey, expectedHash = null) {
  try {
    const updatedFile = await request({url: url, qs: {"drmkey": drmKey}, encoding: null});

    if(expectedHash && expectedHash !== hash(updatedFile))
      throw "ERROR: " + url + "\nDownloaded file doesn't match hash specified in patch manifest! Possible causes:\n   + Incorrect manifest specified by module developer\n   + NoPing (if you're using it) has a bug that can fuck up the download";

    forcedirSync(path.dirname(filepath));
    fs.writeFileSync(filepath, updatedFile);
    return [file, true, ""];
  } catch (e) {
    return [file, false, e];
  }
}

async function autoUpdateModule(name, root, updateData, updatelog, updatelimit, region, serverIndex = 0) {
  try {
    // If only one file (module.json) exists, it's a fresh install
    if (walkdir(root, true, false).length === 1)
      console.log("[update] Installing module " + name);
    else if (updatelog)
      console.log("[update] Updating module " + name);

    const manifest_url = updateData["servers"][serverIndex] + 'manifest.json';
    if(updatelog)
      console.log("[update] - Retrieving update manifest (Server " + serverIndex + ")");

    const manifest = await request({url: manifest_url, qs: {"drmkey": updateData["drmKey"]}, json: true});
    if(typeof manifest !== 'object')
      throw "Invalid manifest.json!";

    let promises = [];
    for(let file in manifest["files"]) {
      let filepath = path.join(root, file);
      let filedata = manifest["files"][file];

      // Check if the file is required for the active game region
      let matchesRegion = true;
      if(typeof filedata === 'object' && filedata["region"]) {
        if(typeof filedata["region"] == 'object')
          matchesRegion = filedata["region"].includes(region);
        else
          matchesRegion = filedata["region"] === region;
      }

      if (!matchesRegion)
        continue;

      // Check if the file needs to be updated
      let needsUpdate = !fs.existsSync(filepath);
      let expectedHash = null;
      if(!needsUpdate) {
        if(typeof filedata === 'object') {
          expectedHash = filedata["hash"].toUpperCase();
          needsUpdate = filedata["overwrite"] && (hash(fs.readFileSync(filepath)) !== expectedHash);
        } else {
          expectedHash = filedata.toUpperCase();
          needsUpdate = (hash(fs.readFileSync(filepath)) !== expectedHash);
        }
      }

      // Update file if required
      if(needsUpdate) {
        const file_url = updateData["servers"][serverIndex] + file;
        if(updatelog)
          console.log("[update] - Download " + file);

        let promise = autoUpdateFile(file, filepath, file_url, updateData["drmKey"], manifest["no_hash_verification"] ? null : expectedHash);
        promises.push(updatelimit ? (await promise) : promise);
      }
    }

    if(manifest["force_clean"]) {
      // Remove unlisted files
      walkdir(root, true, false).forEach(filepath => {
        if(!manifest["files"][filepath] && filepath != 'module.json') {
          if(updatelog)
            console.log("[update] - Delete " + filepath);
          fs.unlinkSync(path.join(root, filepath));
        }
      });

      // Remove empty folders
      walkdir(root, false, true).forEach(folderpath => {
        try {
          // Just try deleting it, will fail if it's not empty
          fs.rmdirSync(path.join(root, folderpath));

          if(updatelog)
            console.log("[update] - Delete " + folderpath);
        } catch(_) { }
      });
    }

    return {"defs": manifest["defs"], "results": updatelimit ? promises : (await Promise.all(promises))};
  } catch(e) {
    if(serverIndex + 1 < updateData["servers"].length)
        return autoUpdateModule(name, root, updateData, updatelog, updatelimit, region, serverIndex + 1);
    else
        return Promise.reject(e);
  }
}

async function autoUpdateDef(def, filepath, expectedHash = null) {
  return await autoUpdateFile(def, filepath, TeraDataAutoUpdateServer + "protocol/" + def, undefined, expectedHash);
}

async function autoUpdateDefs(requiredDefs, updatelog, updatelimit) {
  let promises = [];

  if(updatelog)
    console.log("[update] Updating defs");

  const defs = await request({url: TeraDataAutoUpdateServer + 'defs.json', json: true});
  for(let def in defs) {
    let filepath = path.join(__dirname, '..', '..', 'node_modules', 'tera-data', 'protocol', def);
    let expectedHash = defs[def].toUpperCase();
    if(!fs.existsSync(filepath) || hash(fs.readFileSync(filepath)) !== expectedHash) {
      if(updatelog)
        console.log("[update] - " + def);

      let promise = autoUpdateDef(def, filepath, expectedHash);
      promises.push(updatelimit ? (await promise) : promise);
    }
  }

  // TODO: check if all requiredDefs are in def list
  // TODO: delete outdated defs, ...

  return promises;
}

async function autoUpdateMaps(updatelog, updatelimit) {
  let promises = [];
  let protocol_data = {}

  if(updatelog)
    console.log("[update] Updating maps");

  const mappings = await request({url: TeraDataAutoUpdateServer + 'mappings.json', json: true});
  for(let region in mappings) {
    let mappingData = mappings[region];
    protocol_data[mappingData['version']] = {
        'region': region.toLowerCase().split('-')[0],
        'major_patch': mappingData['major_patch'],
        'minor_patch': mappingData['minor_patch'],
    }

    let protocol_name = 'protocol.' + mappingData["version"].toString() + '.map';
    let sysmsg_name = 'sysmsg.' + mappingData["version"].toString() + '.map';

    let protocol_custom_filename = path.join(__dirname, '..', '..', 'node_modules', 'tera-data', 'map', protocol_name);
    if(!fs.existsSync(protocol_custom_filename)) {
      forcedirSync(path.dirname(protocol_custom_filename));
      fs.closeSync(fs.openSync(protocol_custom_filename, 'w'));
    }

    let protocol_filename = path.join(__dirname, '..', '..', 'node_modules', 'tera-data', 'map_base', protocol_name);
    if(!fs.existsSync(protocol_filename) || hash(fs.readFileSync(protocol_filename)) !== mappingData["protocol_hash"].toUpperCase()) {
      if(updatelog)
        console.log("[update] - " + protocol_name);

      let promise = autoUpdateFile(protocol_name, protocol_filename, TeraDataAutoUpdateServer + "map_base/" + protocol_name);
      promises.push(updatelimit ? (await promise) : promise);
    }

    let sysmsg_filename = path.join(__dirname, '..', '..', 'node_modules', 'tera-data', 'map_base', sysmsg_name);
    if(!fs.existsSync(sysmsg_filename) || hash(fs.readFileSync(sysmsg_filename)) !== mappingData["sysmsg_hash"].toUpperCase()) {
      if(updatelog)
        console.log("[update] - " + sysmsg_name);

      let promise = autoUpdateFile(sysmsg_name, sysmsg_filename, TeraDataAutoUpdateServer + "map_base/" + sysmsg_name);
      promises.push(updatelimit ? (await promise) : promise);
    }
  }

  return [protocol_data, promises];
}

async function autoUpdate(moduleBase, modules, updatelog, updatelimit, region) {
  console.log("[update] Auto-update started!");
  let requiredDefs = new Set(["C_CHECK_VERSION.1.def"]);

  let successModules = [];
  let legacyModules = [];
  let failedModules = [];
  for (let module of modules) {
    if(!module.endsWith('.js')) {
      let root = path.join(moduleBase, module);
      try {
        let moduleConfigChanged;
        do {
          moduleConfigChanged = false;

          let updateData = fs.readFileSync(path.join(root, 'module.json'), 'utf8');
          try {
            updateData = JSON.parse(updateData);
            if(updateData["disableAutoUpdate"]) {
              console.warn("[update] WARNING: Auto-update disabled for module %s!", module);
              successModules.push({
                "name": module,
                "options": updateData["options"] || {},
              });
            } else {
              try {
                const moduleConfig = await autoUpdateModule(module, root, updateData, updatelog, updatelimit, region);

                let failedFiles = [];
                for(let result of moduleConfig["results"]) {
                  if(!result[1]) {
                    failedFiles.push(result[0]);
                    failedFiles.push(result[2]);
                  } else {
                    if(result[0] === "module.json") {
                      moduleConfigChanged = true;
                      if(updatelog)
                        console.log("[update] - Module configuration changed, restarting update!");
                    }
                  }
                }

                if(!moduleConfigChanged) {
                  for(let def in moduleConfig["defs"]) {
                    let def_data = moduleConfig["defs"][def];
                    if(typeof def_data === 'object') {
                      for(let def_ver of def_data) {
                        if(def_ver !== 'raw')
                          requiredDefs.add(def + "." + def_ver.toString() + ".def");
                      }
                    } else {
                      if(def_data !== 'raw')
                        requiredDefs.add(def + "." + def_data.toString() + ".def");
                    }
                  }

                  if(failedFiles.length > 0)
                    throw "Failed to update the following module files:\n - " + failedFiles.join("\n - ");

                  successModules.push({
                    "name": module,
                    "options": updateData["options"] || {},
                  });
                }
              } catch(e) {
                console.error("[update] ERROR: Unable to auto-update module %s:\n%s", module, e);
                if(updateData["supportUrl"]) {
                  console.error("[update] Please go to %s and follow the given instructions or ask for help.", updateData["supportUrl"]);
                  if(updateData["supportUrl"] !== DiscordURL)
                    console.error("[update] Alternatively, join %s and ask in the #help channel.", DiscordURL);
                } else {
                  console.error("[update] Please contact the module author or join %s and ask in the #help channel.", DiscordURL);
                }

                failedModules.push({
                  "name": module,
                  "options": updateData["options"] || {},
                });
              }
            }
          } catch(e) {
            console.error("[update] ERROR: Failed to parse auto-update configuration for module %s:\n%s", module, e);
            failedModules.push({
              "name": module,
              "options": {},
            });
          }
        } while(moduleConfigChanged);
      } catch(_) {
        // legacy module without auto-update functionality
        legacyModules.push({
          "name": module,
          "options": {},
        });
      }
    } else {
      legacyModules.push({
        "name": module,
        "options": {},
      });
    }
  }

  let updatePromises = await autoUpdateDefs(requiredDefs, updatelog, updatelimit);
  let mapResults = await autoUpdateMaps(updatelog, updatelimit);
  updatePromises = updatePromises.concat(mapResults[1]);

  let results = updatelimit ? updatePromises : (await Promise.all(updatePromises));
  let failedFiles = [];
  for(let result of results) {
    if(!result[1])
      failedFiles.push(result[0]);
  }

  if(failedFiles.length > 0)
    console.error("[update] ERROR: Unable to update the following def/map files. Please join %s and report this error in the #help channel!\n - %s", DiscordURL, failedFiles.join('\n - '));

  console.log("[update] Auto-update complete!");
  return {"tera-data": (failedFiles.length == 0), "protocol_data": mapResults[0], "updated": successModules, "legacy": legacyModules, "failed": failedModules};
}

module.exports = autoUpdate;
