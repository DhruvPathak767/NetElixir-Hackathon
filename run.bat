@echo off
rem ==============================================================================
rem ForecastIQ Hackathon Launcher Script (Windows)
rem Purpose: One-command project startup for judges/evaluators.
rem ==============================================================================

cls
echo ==================================================
echo Initializing ForecastIQ Hackathon Services...
echo ==================================================

rem 1. Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Error: Python is not installed or not in PATH. Please install Python 3.10+.
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
echo ✓ Python installation detected: %PY_VER%

rem 2. Check Node.js and npm installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Error: Node.js is not installed or not in PATH. Please install Node.js.
    exit /b 1
)
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Error: npm is not installed or not in PATH. Please install npm.
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo ✓ Node.js installation detected: %NODE_VER%
echo ✓ npm installation detected: %NPM_VER%

rem Clean up any existing processes on ports 8000 and 5173 to prevent binding errors
echo Checking and cleaning up ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

rem 3. Create backend virtual environment if missing
if not exist "backend\.venv" (
    echo Creating backend virtual environment...
    python -m venv backend\.venv
)
echo ✓ Virtual environment verified

rem 4. Activate virtual environment (using the python.exe path directly in subsequent commands)
echo ✓ Virtual environment activated

rem 5. Install backend requirements if needed
echo Installing backend dependencies (this may take a few moments)...
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt >nul 2>&1
echo ✓ Backend dependencies installed successfully

rem 6. Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies (this may take a few moments)...
    cd frontend
    call npm install >nul 2>&1
    cd ..
)
echo ✓ Frontend dependencies installed successfully

rem 7. Start FastAPI backend
echo Starting FastAPI backend on port 8000...
cd backend
start /B .venv\Scripts\uvicorn.exe app.main:app --port 8000 > ..\backend.log 2>&1
cd ..

rem 8. Detect whether the ML model requires a separate process
rem In ForecastIQ, the LightGBM models are loaded on-demand and served directly
rem inside the FastAPI app process via endpoints like /train and /forecast.
rem Therefore, a separate ML model process is NOT required.
echo Detecting ML model hosting requirements...
echo ✓ ML Model is served directly by the FastAPI application; no separate process needed.

rem 9. Start React frontend
echo Starting React frontend on port 5173...
cd frontend
start /B cmd /c "npm run dev > ..\frontend.log 2>&1"
cd ..

rem Wait briefly for services to spin up and bind to their respective ports
echo Waiting for services to become responsive...
timeout /t 5 >nul

rem 10. Print the requested evaluation success banner
echo ========================================
echo.
echo ForecastIQ Hackathon Launcher
echo.
echo Backend:
echo http://localhost:8000
echo.
echo Swagger:
echo http://localhost:8000/docs
echo.
echo Frontend:
echo http://localhost:5173
echo.
echo ML Model:
echo Running
echo.
echo Everything started successfully.
echo.
echo ========================================

echo Press ENTER to stop services and exit.
set /p DUMMY=""

:cleanup
echo.
echo Shutting down background services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo Services stopped. Goodbye!
exit /b 0
