@echo off
title TERA Toolbox
cd /d "%~dp0"

IF NOT EXIST ".\node_modules\electron\dist\electron.exe" (
  node -e "" > NUL 2> NUL
  IF %ERRORLEVEL% NEQ 0 (
    ECHO ERROR: Neither Node.JS nor Electron are installed!
    ECHO ERROR: Please go to https://discord.gg/dUNDDtw and follow the installation guide.
  ) ELSE ( 
    node --use-strict ./bin/install-electron.js
  )
) ELSE (
  START .\node_modules\electron\dist\electron --high-dpi-support=1 --force-device-scale-factor=1 --js-flags="--use-strict" ./bin/index-gui.js
)

EXIT
