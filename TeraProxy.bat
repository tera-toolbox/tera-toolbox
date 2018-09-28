@echo off
@setlocal enableextensions
@cd /d "%~dp0/bin/lib"

WHERE node > NUL 2> NUL
IF %ERRORLEVEL% NEQ 0 (
  ECHO ERROR: Node.js is not installed!
  ECHO ERROR: Please go to https://tinyurl.com/caaliproxy and follow the installation guide.
  ECHO(
  PAUSE
) ELSE (
  START cmd.exe /k "node index.js"
)
