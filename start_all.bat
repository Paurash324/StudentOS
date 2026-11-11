@echo off
title StudentOS - Launcher
echo ========================================================
echo        Starting StudentOS (Full-Stack Academic Suite)
echo ========================================================
echo.
echo [1/2] Launching Backend FastAPI in a new terminal...
start "StudentOS Backend" cmd /k "%~dp0start_backend.bat"

echo [2/2] Launching Frontend Vite in a new terminal...
start "StudentOS Frontend" cmd /k "%~dp0start_frontend.bat"

echo.
echo Both servers are launching.
echo Backend API : http://127.0.0.1:8000
echo Frontend UI : http://127.0.0.1:5173
echo.
timeout /t 5
start http://127.0.0.1:5173

