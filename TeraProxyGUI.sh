#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")"

exec ./node_modules/electron/dist/electron --high-dpi-support=1 --force-device-scale-factor=1 --js-flags="--use-strict" ./bin/index.js

