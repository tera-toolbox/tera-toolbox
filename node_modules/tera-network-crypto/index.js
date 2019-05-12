const fs = require('fs');

for (let file of [
    `${__dirname}/build/Release/tera_network_crypto.node`,
    `${__dirname}/bin/${process.arch}/tera_network_crypto_${process.versions.modules}.node`
]) {
    if (fs.existsSync(file)) {
        module.exports = require(file);
        return;
    }
}

console.log(`[toolbox] tera-network-crypto: No build found (arch=${process.arch}, modulesVer=${process.versions.modules}), using JS fallback!`);
module.exports = require('./fallback');
