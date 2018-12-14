@echo off
title Caali's TERA Proxy
cd /d "%~dp0"

START .\node_modules\electron\dist\electron --use-strict ./bin/index.js
EXIT
