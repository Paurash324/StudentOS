@echo off
title StudentOS - Backend API (FastAPI)
cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Checking dependencies...
python -m pip install -q -r requirements.txt

echo [INFO] Starting FastAPI server on http://127.0.0.1:8000 ...
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause

