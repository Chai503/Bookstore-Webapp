@echo off
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=1
echo ========================================================
echo Starting Book Store Backend (Lab 9.6 - Production Prep)
echo Configuration is loaded from .env
echo ========================================================
"C:\Users\Admin\AppData\Local\Programs\antigravity\Antigravity.exe" server.js
pause
