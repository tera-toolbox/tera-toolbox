@echo off
title TERA Toolbox
cd /d "%~dp0"

IF NOT EXIST ".\node_modules\electron\dist\electron.exe" (
  node --use-strict ./bin/install-electron.js
) ELSE (
  START .\node_modules\electron\dist\electron --high-dpi-support=1 --force-device-scale-factor=1 --js-flags="--use-strict" ./bin/index-gui.js
)

EXIT
