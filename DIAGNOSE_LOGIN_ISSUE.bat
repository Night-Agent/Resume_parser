@echo off
echo ===============================================
echo LOGIN/SIGNUP DIAGNOSIS TOOL
echo ===============================================
echo.

echo [Step 1] Checking if Backend is running...
echo.
curl -s -o nul -w "%%{http_code}" http://localhost:5000 > temp_status.txt 2>&1
set /p STATUS=<temp_status.txt
del temp_status.txt 2>nul

if "%STATUS%" == "000" (
    echo [ERROR] Backend is NOT running!
    echo.
    echo Solution: Run START_ALL.bat or manually start backend
    echo Command: cd backend ^&^& npm run dev
    echo.
    echo Checking for node processes...
    tasklist | findstr "node.exe" > nul
    if %errorlevel% equ 0 (
        echo [INFO] Found running node.exe processes. Backend might be on different port.
        tasklist | findstr "node.exe"
    ) else (
        echo [INFO] No node.exe processes found.
    )
    goto :end
) else (
    echo [OK] Backend is responding! (HTTP Status: %STATUS%)
    echo.
    echo Backend Root Response:
    curl -s http://localhost:5000
)
echo.
echo.

echo [Step 2] Checking MongoDB connection and Health endpoint...
echo.
curl -s -o temp_health.txt -w "%%{http_code}" http://localhost:5000/api/health > temp_health_status.txt 2>&1
set /p HEALTH_STATUS=<temp_health_status.txt

if "%HEALTH_STATUS%" == "200" (
    echo [OK] Health endpoint accessible (HTTP 200)
    echo Response:
    type temp_health.txt
    echo.
) else if "%HEALTH_STATUS%" == "404" (
    echo [WARNING] Health endpoint not found (HTTP 404)
    echo [INFO] This might be normal if the route isn't implemented
) else (
    echo [WARNING] Health endpoint returned status: %HEALTH_STATUS%
    echo [INFO] Testing if MongoDB is accessible directly...
    netstat -ano | findstr ":27017" > nul
    if %errorlevel% equ 0 (
        echo [OK] MongoDB port 27017 is listening
    ) else (
        echo [WARNING] MongoDB port 27017 not found
        echo [INFO] You might be using MongoDB Atlas
    )
)
del temp_health.txt 2>nul
del temp_health_status.txt 2>nul
echo.
echo.

echo [Step 3] Testing Auth Register endpoint...
echo.
echo Sending test registration request...
echo Email: test@test.com
echo.
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test123456\",\"firstName\":\"Test\",\"lastName\":\"User\"}" ^
  -w "\nHTTP Status: %%{http_code}\n" -s
echo.
echo [INFO] Expected responses:
echo   - 201/200: Success (may show 'User already exists' if test user exists)
echo   - 400: Bad request (check request format)
echo   - 500: Server error (check MongoDB connection)
echo.
echo.

echo [Step 4] Checking MongoDB Service and Connection...
echo.
sc query MongoDB 2>nul | find "STATE" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB Windows Service found:
    sc query MongoDB | find "STATE"
    sc query MongoDB | find "SERVICE_NAME"
    echo.
    for /f "tokens=4" %%a in ('sc query MongoDB ^| find "STATE"') do (
        if "%%a" == "RUNNING" (
            echo [OK] MongoDB is RUNNING
        ) else (
            echo [ERROR] MongoDB is NOT running!
            echo Solution: net start MongoDB
        )
    )
) else (
    echo [WARNING] MongoDB Windows service not found
    echo.
    echo Checking for MongoDB process...
    tasklist | findstr "mongod.exe" > nul
    if %errorlevel% equ 0 (
        echo [OK] mongod.exe process is running
        tasklist | findstr "mongod.exe"
    ) else (
        echo [INFO] No local MongoDB process found
        echo [INFO] You may be using MongoDB Atlas (cloud database)
    )
)
echo.
echo.

echo [Step 5] Checking .env configuration...
echo.
if exist backend\.env (
    echo [OK] .env file exists
    echo.
    echo Checking required environment variables:
    echo.
    findstr "JWT_SECRET" backend\.env > nul
    if %errorlevel% equ 0 (
        echo [OK] JWT_SECRET: Found
        findstr "JWT_SECRET" backend\.env | findstr "=" > nul
        if %errorlevel% equ 0 (
            echo     Value set: Yes
        )
    ) else (
        echo [ERROR] JWT_SECRET: Missing!
    )
    echo.
    findstr "MONGODB_URI" backend\.env > nul
    if %errorlevel% equ 0 (
        echo [OK] MONGODB_URI: Found
        for /f "tokens=2 delims==" %%a in ('findstr "MONGODB_URI" backend\.env') do (
            echo     URI: %%a
        )
    ) else (
        echo [ERROR] MONGODB_URI: Missing!
    )
    echo.
    findstr "PORT" backend\.env > nul
    if %errorlevel% equ 0 (
        echo [OK] PORT: Found
        findstr "PORT" backend\.env
    ) else (
        echo [INFO] PORT: Not set (will use default 5000)
    )
) else (
    echo [ERROR] .env file not found!
    echo.
    echo Solution: Create backend\.env file with:
    echo   MONGODB_URI=mongodb://localhost:27017/resume_parser
    echo   JWT_SECRET=your_secure_random_string_here
    echo   PORT=5000
    echo.
    if exist backend\.env.example (
        echo [INFO] Found .env.example - you can copy it:
        echo   Command: copy backend\.env.example backend\.env
    )
)
echo.

echo [Step 6] Checking required npm packages...
echo.
if exist backend\node_modules (
    echo [OK] node_modules folder exists
    echo.
    if exist backend\node_modules\openai (
        echo [OK] openai package: Installed
    ) else (
        echo [WARNING] openai package: NOT installed
        echo Solution: cd backend ^&^& npm install openai
    )
    echo.
    if exist backend\node_modules\express (
        echo [OK] express package: Installed
    ) else (
        echo [ERROR] express package: NOT installed!
        echo Solution: cd backend ^&^& npm install
    )
    echo.
    if exist backend\node_modules\mongoose (
        echo [OK] mongoose package: Installed
    ) else (
        echo [ERROR] mongoose package: NOT installed!
        echo Solution: cd backend ^&^& npm install
    )
    echo.
    if exist backend\node_modules\jsonwebtoken (
        echo [OK] jsonwebtoken package: Installed
    ) else (
        echo [ERROR] jsonwebtoken package: NOT installed!
        echo Solution: cd backend ^&^& npm install
    )
) else (
    echo [ERROR] node_modules folder not found!
    echo Solution: cd backend ^&^& npm install
)
echo.

:end
echo.
echo ===============================================
echo DIAGNOSIS COMPLETE
echo ===============================================
echo.
echo QUICK FIX CHECKLIST:
echo.
echo [ ] 1. Backend running?     : Run START_ALL.bat
echo [ ] 2. MongoDB running?      : net start MongoDB (or check Atlas)
echo [ ] 3. Dependencies installed?: cd backend ^&^& npm install
echo [ ] 4. .env file configured? : Check JWT_SECRET and MONGODB_URI
echo [ ] 5. Firewall blocking?    : Allow node.exe and mongod.exe
echo [ ] 6. Port 5000 available?  : netstat -ano ^| findstr :5000
echo.
echo ADDITIONAL COMMANDS:
echo   - Check backend logs: cd backend ^&^& npm run dev
echo   - Reinstall packages: cd backend ^&^& npm ci
echo   - Reset database: mongo resume_parser --eval "db.dropDatabase()"
echo   - Test login endpoint: curl -X POST http://localhost:5000/api/auth/login
echo.
echo For detailed troubleshooting, see LOGIN_TROUBLESHOOTING.md
echo.
pause
