@echo off
title StudentOS - Frontend (React + Vite)
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

echo [INFO] Starting Vite development server on http://127.0.0.1:5173 ...
call npm run dev
pause

