@echo off
set "WINGET_NODE=C:\Users\amanh\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.13.0-win-x64"
set "PATH=%WINGET_NODE%;%PATH%"

cd backend
echo Running unban script...
node unban-me.js
pause
