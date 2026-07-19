#!/bin/bash
set -e

# --- System Checks ---
if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
    echo "✗ Python not installed"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)

if ! command -v node >/dev/null 2>&1; then
    echo "✗ Node not installed"
    exit 1
fi

if [ ! -f "backend/requirements.txt" ]; then
    echo "✗ requirements.txt missing"
    exit 1
fi

# --- Setup Directories & Logs ---
mkdir -p logs
touch logs/backend.log logs/frontend.log

# --- Python Venv ---
if [ ! -d "backend/.venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv backend/.venv
fi

source backend/.venv/bin/activate

if ! python -c "import fastapi, uvicorn, pydantic, sqlalchemy, sklearn, lightgbm" >/dev/null 2>&1; then
    echo "Installing backend requirements..."
    pip install -r backend/requirements.txt
else
    echo "✓ Backend requirements already satisfied"
fi

# --- Frontend Package Manager & Dev ---
cd frontend
if [ -f "yarn.lock" ]; then
    PM="yarn"
elif [ -f "pnpm-lock.yaml" ]; then
    PM="pnpm"
else
    PM="npm"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies with $PM..."
    $PM install || { echo "✗ npm install failed"; exit 1; }
fi

FRONTEND_PORT=$(grep -o 'port: [0-9]*' vite.config.ts | grep -o '[0-9]*' || echo "5173")
cd ..

# --- Port Cleanup ---
echo "Cleaning up ports 8000 and $FRONTEND_PORT..."
if command -v lsof >/dev/null 2>&1; then
    lsof -t -i tcp:8000 | xargs kill -9 2>/dev/null || true
    lsof -t -i tcp:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
elif command -v fuser >/dev/null 2>&1; then
    fuser -k 8000/tcp >/dev/null 2>&1 || true
    fuser -k $FRONTEND_PORT/tcp >/dev/null 2>&1 || true
fi

# --- Startup Services ---
if [ -f "backend/.env" ]; then
    cp backend/.env .env 2>/dev/null || true
    export $(grep -v '^#' backend/.env | xargs)
fi

echo "Starting backend..."
cd backend
../backend/.venv/bin/uvicorn app.main:app --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Starting frontend..."
cd frontend
$PM run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

cleanup() {
    echo -e "\nShutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    rm -f .env
    exit 0
}
trap cleanup SIGINT SIGTERM

# --- Verify Startup ---
echo "Verifying backend startup..."
if ! python -c "
import urllib.request, time
for _ in range(30):
    try:
        if urllib.request.urlopen('http://localhost:8000/health', timeout=1).status == 200:
            exit(0)
    except Exception:
        pass
    time.sleep(1)
exit(1)
"; then
    echo "✗ Backend failed to start. Last log lines:"
    tail -n 15 logs/backend.log
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo "Verifying frontend startup..."
if ! python -c "
import urllib.request, time
for _ in range(30):
    try:
        urllib.request.urlopen('http://localhost:$FRONTEND_PORT', timeout=1)
        exit(0)
    except Exception:
        pass
    time.sleep(1)
exit(1)
"; then
    echo "✗ Frontend failed to start. Last log lines:"
    tail -n 15 logs/frontend.log
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# --- Status Banner ---
echo "================================================="
echo "ForecastIQ Hackathon Launcher"
echo "================================================="
echo ""
echo "   ✓ Backend Running"
echo "   http://localhost:8000"
echo ""
echo "   ✓ Swagger"
echo "   http://localhost:8000/docs"
echo ""
echo "   ✓ Frontend Running"
echo "   http://localhost:$FRONTEND_PORT"
echo ""
echo "   ✓ Logs"
echo "   logs/backend.log"
echo "   logs/frontend.log"
echo ""
echo "Everything started successfully."
echo ""
echo "================================================="

while true; do
    sleep 1
done
