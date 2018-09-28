#/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node="$(command -v node)"
if command -v node >/dev/null 2>&1
then
    cd "$DIR"
    exec node bin/lib/index.js
else
    echo "node.js is required to run this. Consult the package manager of your distro."
fi
