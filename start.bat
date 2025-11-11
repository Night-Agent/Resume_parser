@echo off
REM Startup script for Resume AI Platform (Windows)

echo 🚀 Starting Resume AI Platform...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

REM Install Python dependencies
echo 📦 Installing Python AI dependencies...
cd backend\src\ai

if not exist requirements.txt (
    echo ❌ requirements.txt not found in backend\src\ai\
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo 🐍 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
pip install -r requirements.txt

REM Download spaCy model
python -m spacy download en_core_web_sm

echo ✅ Python AI service dependencies installed

REM Start Python AI service
echo 🤖 Starting Python AI service on port 5001...
start "Python AI Service" python resume_ai_service.py

REM Wait for Python service to start
timeout /t 10 /nobreak >nul

REM Go back to project root and start Node.js backend
cd ..\..\..\
echo 🟢 Starting Node.js backend on port 5000...
cd backend
call npm install
start "Backend API" npm start

REM Start frontend
cd ..\frontend
echo ⚛️ Starting React frontend on port 3000...
call npm install
start "Frontend" npm start

echo 🎉 All services started!
echo 📊 Python AI Service: http://localhost:5001/health
echo 🔧 Backend API: http://localhost:5000/health
echo 🌐 Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul