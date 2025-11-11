@echo off
echo ===============================================
echo LOGIN/SIGNUP DIAGNOSIS TOOL
echo ===============================================
echo.

echo [Step 1] Checking if Backend is running...
echo.
curl -s http://localhost:5000 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is responding!
    curl http://localhost:5000
) else (
    echo [ERROR] Backend is NOT running!
    echo Solution: Run START_ALL.bat or manually start backend
    echo Command: cd backend ^&^& npm run dev
    goto :end
)
echo.
echo.

echo [Step 2] Checking MongoDB connection...
echo.
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Health endpoint accessible
    curl http://localhost:5000/api/health
) else (
    echo [WARNING] Health endpoint not found (this is normal)
)
echo.
echo.

echo [Step 3] Testing Auth Register endpoint...
echo.
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test123456\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
echo.
echo.

echo [Step 4] Checking MongoDB Service...
echo.
sc query MongoDB | find "STATE" > nul 2>&1
if %errorlevel% equ 0 (
    sc query MongoDB | find "STATE"
    echo [INFO] If state is STOPPED, run: net start MongoDB
) else (
    echo [WARNING] MongoDB service not found
    echo [INFO] You may be using MongoDB Atlas (cloud) - check .env file
)
echo.
echo.

echo [Step 5] Checking .env configuration...
echo.
if exist backend\.env (
    echo [OK] .env file exists
    echo.
    echo JWT_SECRET:
    findstr "JWT_SECRET" backend\.env
    echo.
    echo MONGODB_URI:
    findstr "MONGODB_URI" backend\.env
    echo.
) else (
    echo [ERROR] .env file not found!
    echo Solution: Copy .env.example to .env or create manually
)
echo.

echo [Step 6] Checking openai package...
echo.
if exist backend\node_modules\openai (
    echo [OK] openai package is installed
) else (
    echo [ERROR] openai package is NOT installed!
    echo Solution: cd backend ^&^& npm install openai
)
echo.

:end
echo ===============================================
echo DIAGNOSIS COMPLETE
echo ===============================================
echo.
echo Common Solutions:
echo 1. Backend not running: Run START_ALL.bat
echo 2. MongoDB not running: net start MongoDB
echo 3. Missing package: cd backend ^&^& npm install openai
echo 4. Wrong credentials: Check MongoDB URI in .env
echo.
pause
