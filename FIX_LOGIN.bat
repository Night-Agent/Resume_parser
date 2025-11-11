@echo off
echo ===============================================
echo QUICK FIX FOR LOGIN/SIGNUP ISSUES
echo ===============================================
echo.

echo This script will:
echo 1. Install missing OpenAI package
echo 2. Check MongoDB status
echo 3. Update JWT_SECRET if needed
echo 4. Start the backend server
echo.

set /p continue="Continue? (Y/N): "
if /i not "%continue%"=="Y" goto :end

echo.
echo [Step 1] Installing OpenAI package...
cd backend
call npm install openai
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install openai package
    goto :end
)
echo [OK] OpenAI package installed
cd ..
echo.

echo [Step 2] Checking MongoDB...
sc query MongoDB | find "RUNNING" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB is running
) else (
    echo [WARNING] MongoDB is not running
    echo Attempting to start MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo [INFO] Could not start MongoDB locally
        echo.
        echo You have 2 options:
        echo   Option 1: Install MongoDB locally
        echo   Option 2: Use MongoDB Atlas (cloud - FREE)
        echo.
        echo For MongoDB Atlas:
        echo   1. Go to https://mongodb.com/cloud/atlas
        echo   2. Create free account + cluster
        echo   3. Get connection string
        echo   4. Update MONGODB_URI in backend\.env
        echo.
        set /p useatlas="Do you want to use MongoDB Atlas? (Y/N): "
        if /i "!useatlas!"=="Y" (
            echo.
            echo Opening MongoDB Atlas in browser...
            start https://mongodb.com/cloud/atlas/register
            echo.
            echo After setting up:
            echo 1. Copy your connection string
            echo 2. Open backend\.env
            echo 3. Replace MONGODB_URI with your connection string
            echo 4. Run this script again
            echo.
            pause
            goto :end
        )
    )
)
echo.

echo [Step 3] Checking JWT_SECRET...
findstr "JWT_SECRET=your-super-secret" backend\.env > nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Using default JWT_SECRET
    echo Generating new JWT_SECRET...
    
    REM Generate a random 32-character string
    set "chars=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    set "secret="
    for /l %%i in (1,1,32) do (
        set /a "rand=!random! %% 62"
        for %%j in (!rand!) do set "secret=!secret!!chars:~%%j,1!"
    )
    
    echo New JWT_SECRET generated
    echo Please manually update backend\.env:
    echo JWT_SECRET=!secret!
    echo.
) else (
    echo [OK] JWT_SECRET is configured
)
echo.

echo [Step 4] Starting backend server...
echo.
echo Opening new terminal for backend...
start cmd /k "cd /d %cd%\backend && echo Starting Backend Server... && npm run dev"
echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul
echo.

echo [Step 5] Testing backend...
curl -s http://localhost:5000 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running!
    echo.
    curl http://localhost:5000
    echo.
    echo.
    echo ===============================================
    echo SUCCESS! Backend is running
    echo ===============================================
    echo.
    echo Now you can:
    echo 1. Open http://localhost:3000 in your browser
    echo 2. Try to register a new account
    echo 3. Try to login
    echo.
    echo If frontend is not running:
    echo   - Open new terminal
    echo   - cd frontend
    echo   - npm start
    echo.
) else (
    echo [ERROR] Backend failed to start
    echo.
    echo Check the backend terminal for error messages
    echo Common issues:
    echo   - MongoDB not connected
    echo   - Port 5000 already in use
    echo   - Missing dependencies
    echo.
)

:end
echo.
pause
