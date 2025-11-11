@echo off
echo ========================================
echo Installing Missing OpenAI Package
echo ========================================
echo.

cd /d "%~dp0backend"
echo Current directory: %CD%
echo.

echo Installing openai package...
call npm install openai

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Update backend\.env file with proper values
echo 3. Run: npm run dev (in backend folder)
echo.
pause
