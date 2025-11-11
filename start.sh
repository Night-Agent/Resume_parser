#!/bin/bash
# Startup script for Resume AI Platform

echo "🚀 Starting Resume AI Platform..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python AI dependencies..."
cd backend/src/ai
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found in backend/src/ai/"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

echo "✅ Python AI service dependencies installed"

# Start Python AI service in background
echo "🤖 Starting Python AI service on port 5001..."
python resume_ai_service.py &
PYTHON_PID=$!

# Wait for Python service to start
sleep 10

# Go back to project root and start Node.js backend
cd ../../../
echo "🟢 Starting Node.js backend on port 5000..."
cd backend
npm install
npm start &
NODE_PID=$!

# Start frontend
cd ../frontend
echo "⚛️ Starting React frontend on port 3000..."
npm install
npm start &
FRONTEND_PID=$!

echo "🎉 All services started!"
echo "📊 Python AI Service: http://localhost:5001/health"
echo "🔧 Backend API: http://localhost:5000/health"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "To stop all services, press Ctrl+C or run: kill $PYTHON_PID $NODE_PID $FRONTEND_PID"

# Wait for any process to exit
wait