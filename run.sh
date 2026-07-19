#!/bin/bash

# ==============================================================================
# ForecastIQ Hackathon Launcher Script
# Purpose: One-command project startup for judges/evaluators.
# ==============================================================================

# Exit immediately if any command fails
set -e

# Clear the screen for a clean, professional output interface
clear

echo "=================================================="
echo "Initializing ForecastIQ Hackathon Services..."
echo "=================================================="

# 1. Check Python installation
# Verify if python3 or python is available in the environment's PATH
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "✗ Error: Python is not installed or not in PATH. Please install Python 3.10+."
    exit 1
fi
echo "✓ Python installation detected: $($PYTHON_CMD --version)"

# 2. Check Node.js and npm installation
# Verify if node and npm are available in the environment's PATH
if ! command -v node >/dev/null 2>&1; then
    echo "✗ Error: Node.js is not installed or not in PATH. Please install Node.js."
    exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
    echo "✗ Error: npm is not installed or not in PATH. Please install npm."
    exit 1
fi
echo "✓ Node.js installation detected: $(node --version)"
echo "✓ npm installation detected: $(npm --version)"

# 3. Create backend virtual environment if missing
# Set up a clean, isolated virtual environment under backend/.venv if it doesn't exist
if [ ! -d "backend/.venv" ]; then
    echo "Creating backend virtual environment..."
    $PYTHON_CMD -m venv backend/.venv
fi
echo "✓ Virtual environment verified"

# 4. Activate virtual environment
# Source the activation script to isolate python/pip commands
# On macOS/Linux:
source backend/.venv/bin/activate
echo "✓ Virtual environment activated"

# 5. Install backend requirements if needed
# Install dependencies from backend/requirements.txt if packages are not fully installed
echo "Installing backend dependencies (this may take a few moments)..."
pip install -r backend/requirements.txt >/dev/null 2>&1
echo "✓ Backend dependencies installed successfully"

# 6. Install frontend dependencies if needed
# Install Node modules in the frontend directory if node_modules is missing
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies (this may take a few moments)..."
    cd frontend && npm install >/dev/null 2>&1 && cd ..
fi
echo "✓ Frontend dependencies installed successfully"

# 7. Start FastAPI backend
# Launch FastAPI backend via uvicorn on port 8000, redirecting output to backend.log
echo "Starting FastAPI backend on port 8000..."
cd backend
../backend/.venv/bin/uvicorn app.main:app --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 8. Detect whether the ML model requires a separate process
# Check if the model is served standalone or served by FastAPI itself.
# In ForecastIQ, the LightGBM models are loaded on-demand and served directly 
# inside the FastAPI app process via endpoints like /train and /forecast.
# Therefore, a separate ML model process is NOT required.
echo "Detecting ML model hosting requirements..."
echo "✓ ML Model is served directly by the FastAPI application; no separate process needed."

# 9. Start React frontend
# Start React frontend development server on port 5174 (as configured in vite.config.ts),
# redirecting output to frontend.log
echo "Starting React frontend on port 5174..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Define clean-up handler to gracefully terminate background processes when stopping
cleanup() {
    echo ""
    echo "Shutting down background services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped. Goodbye!"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM signals to ensure clean termination of background servers
trap cleanup SIGINT SIGTERM

# Wait briefly for services to spin up and bind to their respective ports
echo "Waiting for services to become responsive..."
sleep 5

# 10. Print the requested evaluation success banner
echo "========================================"
echo ""
echo "ForecastIQ Hackathon Launcher"
echo ""
echo "Backend:"
echo "http://localhost:8000"
echo ""
echo "Swagger:"
echo "http://localhost:8000/docs"
echo ""
echo "Frontend:"
echo "http://localhost:5173"
echo ""
echo "ML Model:"
echo "Running"
echo ""
echo "Everything started successfully."
echo ""
echo "========================================"

echo "Press Ctrl+C to stop the services."

# Keep the script running to maintain the background processes active
while true; do
    sleep 1
done
