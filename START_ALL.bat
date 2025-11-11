@echo off
title Resume Parser - Complete Setup and Start

echo ============================================
echo Resume Parser - Complete Setup and Start
echo ============================================
echo.

REM Step 1: Install missing OpenAI package
echo [STEP 1/4] Installing missing OpenAI package...
cd /d "%~dp0backend"
call npm install openai
if %errorlevel% neq 0 (
    echo ERROR: Failed to install openai package
    pause
    exit /b 1
)
echo ✓ OpenAI package installed
echo.

REM Step 2: Check MongoDB
echo [STEP 2/4] Checking MongoDB status...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✓ MongoDB is running
) else (
    echo ⚠ MongoDB is not running
    echo   Please start MongoDB or use MongoDB Atlas
    echo   Press any key to continue anyway...
    pause >nul
)
echo.

REM Step 3: Check .env file
echo [STEP 3/4] Checking environment configuration...
if exist ".env" (
    echo ✓ .env file found
) else (
    echo ⚠ .env file not found! Copying from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env"
    )
)
echo.

REM Step 4: Start servers
echo [STEP 4/4] Starting servers...
echo.
echo Opening 2 terminal windows:
echo   - Terminal 1: Backend (Node.js) on port 5000
echo   - Terminal 2: Frontend (React) on port 3000
echo.
echo ============================================
echo.

REM Start Backend in new window
start "Backend Server" cmd /k "cd /d %~dp0backend && echo Starting Backend Server... && npm run dev"

REM Wait 5 seconds for backend to start
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start Frontend in new window  
start "Frontend Server" cmd /k "cd /d %~dp0frontend && echo Starting Frontend Server... && npm start"

echo.
echo ============================================
echo Servers are starting!
echo ============================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Check the opened terminal windows for status.
echo.
echo Press any key to exit this window...
pause >nul
