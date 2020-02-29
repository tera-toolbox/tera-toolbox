const fs = require('fs')

const file = `${__dirname}/scanner_${process.versions.modules}.node`
if (!fs.existsSync(file))
    throw Error(`scanner: No build found (modulesVer=${process.versions.modules})`)

module.exports = require(file)
