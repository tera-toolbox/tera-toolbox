#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v node > /dev/null 2>&1; then
  cd "$DIR"
  exec node --use-strict ./bin/index.js
else
  echo "ERROR: Node.js is not installed!"
  echo "ERROR: Please go to http://discord.gg/dUNDDtw and follow the installation guide."
fi

