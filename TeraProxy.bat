@echo off
title Caali's TERA Proxy
cd /d "%~dp0"

WHERE node > NUL 2> NUL
IF %ERRORLEVEL% NEQ 0 (
  ECHO ERROR: Node.js is not installed!
  ECHO ERROR: Please go to https://discord.gg/dUNDDtw and follow the installation guide.
) ELSE (
  node --use-strict ./bin/index.js
)

ECHO(
PAUSE
