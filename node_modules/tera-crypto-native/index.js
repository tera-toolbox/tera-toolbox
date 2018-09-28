const fs = require('fs')

const file = `${__dirname}/bin/${process.arch}/tera-crypto-native_${process.versions.modules}.node`
if(!fs.existsSync(file))
    throw Error(`tera-crypto-native: No build found (arch=${process.arch}, modulesVer=${process.versions.modules})`)

module.exports = require(file)
