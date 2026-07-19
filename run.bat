@echo off
setlocal enabledelayedexpansion

:: --- System Checks ---
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Python not installed
    exit /b 1
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node not installed
    exit /b 1
)

if not exist "backend\requirements.txt" (
    echo ✗ requirements.txt missing
    exit /b 1
)

:: --- Setup Directories & Logs ---
if not exist "logs" mkdir logs
type nul > logs\backend.log
type nul > logs\frontend.log

:: --- Python Venv ---
if not exist "backend\.venv" (
    echo Creating virtual environment...
    python -m venv backend\.venv
)

:: --- Install Backend Requirements ---
backend\.venv\Scripts\python.exe -c "import fastapi, uvicorn, pydantic, sqlalchemy, sklearn, lightgbm" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing backend requirements...
    backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
) else (
    echo ✓ Backend requirements already satisfied
)

:: --- Frontend Setup ---
cd frontend
if exist "yarn.lock" (
    set PM=yarn
) else if exist "pnpm-lock.yaml" (
    set PM=pnpm
) else (
    set PM=npm
)

if not exist "node_modules" (
    echo Installing frontend dependencies with !PM!...
    call !PM! install
    if %errorlevel% neq 0 (
        echo ✗ npm install failed
        cd ..
        exit /b 1
    )
)

:: --- Detect Port ---
for /f %%i in ('..\backend\.venv\Scripts\python.exe -c "import re; f=open('vite.config.ts').read(); m=re.search(r'port:\s*(\d+)', f); print(m.group(1) if m else 5173)"') do set FRONTEND_PORT=%%i
cd ..

:: --- Port Cleanup ---
echo Cleaning up ports 8000 and %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: --- Start Services ---
echo Starting backend...
cd backend
start /B .venv\Scripts\uvicorn.exe app.main:app --reload > ..\logs\backend.log 2>&1
cd ..

echo Starting frontend...
cd frontend
start /B cmd /c "!PM! run dev > ..\logs\frontend.log 2>&1"
cd ..

:: --- Verify Backend ---
echo Verifying backend startup...
echo import urllib.request, time, sys > logs\check.py
echo for _ in range^(30^): >> logs\check.py
echo   try: >> logs\check.py
echo     if urllib.request.urlopen^("http://localhost:8000/health", timeout=1^).status == 200: sys.exit^(0^) >> logs\check.py
echo   except Exception: pass >> logs\check.py
echo   time.sleep^(1^) >> logs\check.py
echo sys.exit^(1^) >> logs\check.py

backend\.venv\Scripts\python.exe logs\check.py
set VERIFY_ERR=%errorlevel%
del logs\check.py

if %VERIFY_ERR% neq 0 (
    echo ✗ Backend failed to start. Last log lines:
    powershell -Command "Get-Content logs\backend.log -Tail 15"
    goto cleanup
)

:: --- Verify Frontend ---
echo Verifying frontend startup...
echo import urllib.request, time, sys > logs\check.py
echo for _ in range^(30^): >> logs\check.py
echo   try: >> logs\check.py
echo     urllib.request.urlopen^("http://localhost:%FRONTEND_PORT%", timeout=1^) >> logs\check.py
echo     sys.exit^(0^) >> logs\check.py
echo   except Exception: pass >> logs\check.py
echo   time.sleep^(1^) >> logs\check.py
echo sys.exit^(1^) >> logs\check.py

backend\.venv\Scripts\python.exe logs\check.py
set VERIFY_ERR=%errorlevel%
del logs\check.py

if %VERIFY_ERR% neq 0 (
    echo ✗ Frontend failed to start. Last log lines:
    powershell -Command "Get-Content logs\frontend.log -Tail 15"
    goto cleanup
)

:: --- Status Banner ---
echo =================================================
echo ForecastIQ Hackathon Launcher
echo =================================================
echo.
echo    ✓ Backend Running
echo    http://localhost:8000
echo.
echo    ✓ Swagger
echo    http://localhost:8000/docs
echo.
echo    ✓ Frontend Running
echo    http://localhost:%FRONTEND_PORT%
echo.
echo    ✓ Logs
echo    logs/backend.log
echo    logs/frontend.log
echo.
echo Everything started successfully.
echo.
echo =================================================

echo Press ENTER to stop services and exit.
set /p DUMMY=""

:cleanup
echo.
echo Shutting down services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
exit /b 0
