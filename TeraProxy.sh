#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if test "x$(command -v node)" != "x"; then
  cd "$DIR"
  exec node --use-strict ./bin/index.js
else
  echo "ERROR: Node.js is not installed!"
  echo "ERROR: Please go to http://discord.gg/dUNDDtw and follow the installation guide."
fi

echo "Press return to continue..."
read

