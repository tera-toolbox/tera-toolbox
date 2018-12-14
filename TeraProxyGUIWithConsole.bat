@echo off
title Caali's TERA Proxy
cd /d "%~dp0"

.\node_modules\electron\dist\electron --use-strict ./bin/index.js

ECHO(
PAUSE
