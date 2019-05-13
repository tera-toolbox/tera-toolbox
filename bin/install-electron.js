console.log('Downloading Electron...');

const { update } = require('./update-electron.js');
update().then(() => {
    console.log('Download finished. Installing...');
    process.exit();
}).catch(e => {
    console.log(e);
});
