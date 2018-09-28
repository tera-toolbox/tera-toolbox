async function updateSelf() {
  delete require.cache[require.resolve('./update-self')];
  const autoUpdateSelf = require("./update-self");
  try {
    let result = await autoUpdateSelf();
    if(result)
      return updateSelf();
    else
      return true;
  } catch(_) {
    return false;
  }
}

updateSelf().then((result) => {
  if(result)
    require("./proxy");
  else
    console.log("Failed to auto-update the proxy, terminating...");
});
