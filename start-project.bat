@echo off
setlocal enabledelayedexpansion
color 0B
title Protocol Tournament - Advanced Launch Sequence

echo ========================================================
echo        P R O T O C O L   T O U R N A M E N T S
echo             [ ADVANCED LAUNCH O.S ]
echo ========================================================
echo.

:: 1. Verify Node.js Environment
echo [*] Checking System Core (Node.js/NPM)...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL ERROR] Node.js is not installed or not in PATH.
    echo Please install LTS Node.js from https://nodejs.org/ to continue.
    pause
    exit /b
)
echo [OK] Node Core Online.
echo.

:: 2. Port Sweeper
echo [*] Initializing Port Sweeper (Clearing 3000, 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo [OK] Ports 3000 and 4000 are completely cleared.
echo.

:: 3. Backend Ignition
echo [*] Igniting Backend Engine (Port 4000)...
if not exist "%~dp0backend\node_modules\" (
    echo [INFO] Installing Backend Packages...
    cd /d "%~dp0backend" && call npm.cmd install
)
if not exist "%~dp0backend\node_modules\@prisma\client\" (
    echo [INFO] Syncing Database Prisma Client...
    cd /d "%~dp0backend" && call npx.cmd prisma generate
)

echo [OK] Spawning Backend Process...
start "Protocol Backend Engine" cmd /k "cd /d "%~dp0backend" && color 0D && title [SERVER - BACKEND (PORT 4000)] && echo ========================== && echo    BACKEND ENGINE ONLINE   && echo ========================== && echo Running on Port 4000... && npm.cmd run start:dev"

:: 4. Frontend Ignition
echo.
echo [*] Igniting Next.js Frontend Engine (Port 3000)...
if not exist "%~dp0frontend\node_modules\" (
    echo [INFO] Installing Frontend Packages...
    cd /d "%~dp0frontend" && call npm.cmd install
)

echo [OK] Spawning Frontend Process...
start "Protocol Frontend Engine" cmd /k "cd /d "%~dp0frontend" && color 0A && title [WEB - FRONTEND (PORT 3000)] && echo ========================== && echo   FRONTEND ENGINE ONLINE   && echo ========================== && echo Running on Port 3000... && npm.cmd run dev"

:: 5. Launch Protocol in Browser
echo.
echo ========================================================
echo       ALL SYSTEMS ARE GO - DEPLOYMENT SUCCESSFUL
echo ========================================================
echo Warming up servers...
echo Opening browser in 8 seconds...

ping -n 9 127.0.0.1 > nul

explorer "http://localhost:3000"

echo [TERMINAL] Launcher finished. Both server windows are running in background.
exit
