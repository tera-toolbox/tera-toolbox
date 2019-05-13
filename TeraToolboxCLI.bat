@echo off
title TERA Toolbox
cd /d "%~dp0"

node -e "" > NUL 2> NUL
IF %ERRORLEVEL% NEQ 0 (
  ECHO ERROR: Node.js is not installed!
  ECHO ERROR: Please go to https://discord.gg/dUNDDtw and follow the installation guide.
) ELSE (
  node --use-strict ./bin/index-cli.js
)

ECHO(
PAUSE
