@echo off
echo ==========================================
echo 🚀 PROTOCOL TOURNAMENT - WSL AUTO INSTALLER
echo ==========================================
echo.
echo [1/3] Enabling Windows Subsystem for Linux...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

echo [2/3] Enabling Virtual Machine Platform...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

echo [3/3] Setting App Execution Aliases (Fixing "Access Denied")...
echo Please Note: This script will now open the Microsoft Store to download Ubuntu.
timeout /t 3
start ms-windows-store://pdp/?ProductId=9PDXG59LR1XG

echo.
echo ==========================================
echo ✅ SETUP COMPLETE!
echo.
echo ⚠️ IMPORTANT: PLEASE RESTART YOUR COMPUTER NOW.
echo After restart, Ubuntu will finish installing automatically.
echo ==========================================
pause
