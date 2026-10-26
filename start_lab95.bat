@echo off
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=1
echo Starting Lab 9.5 Server on http://localhost:4000 and http://localhost:8000 ...
"C:\Users\Admin\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe" server.js
pause
