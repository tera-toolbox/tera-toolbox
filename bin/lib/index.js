async function updateSelf() {
  // Temporary code for migration to new file structure
  try {
      const fs = require('fs');
      const path = require('path');
      if(fs.existsSync(path.join(__dirname, '..', 'update-self.js'))) {
        console.log('Proxy has undergone a major update.');
        console.log('Please restart it to apply the changes!');
        process.exit();
      }
  } catch(_) {}

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
