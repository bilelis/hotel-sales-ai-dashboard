@echo off
setlocal enabledelayedexpansion

title Grand Azur Hotel Management - Launcher
cd /d "%~dp0"

echo =====================================================================
echo           GRAND AZUR HOTEL & AI SALES DASHBOARD
echo =====================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Ensure environment configuration files exist
if not exist "hotel-api\.env" (
    if exist "hotel-api\.env.example" (
        echo [*] Initializing hotel-api/.env from .env.example...
        copy "hotel-api\.env.example" "hotel-api\.env" >nul
    )
)

if not exist "front\.env" (
    if exist "front\.env.example" (
        echo [*] Initializing front/.env from .env.example...
        copy "front\.env.example" "front\.env" >nul
    )
)

:: 3. Check and install backend dependencies if needed
if not exist "hotel-api\node_modules" (
    echo [*] Installing dependencies for hotel-api...
    cd /d "%~dp0hotel-api"
    call npm install
    cd /d "%~dp0"
)

:: 4. Build backend if dist does not exist
if not exist "hotel-api\dist\server.js" (
    echo [*] Building TypeScript backend...
    cd /d "%~dp0hotel-api"
    call npm run build
    cd /d "%~dp0"
)

:: 5. Check and install frontend dependencies if needed
if not exist "front\node_modules" (
    echo [*] Installing dependencies for frontend...
    cd /d "%~dp0front"
    call npm install
    cd /d "%~dp0"
)

echo.
echo [1/3] Starting Backend API (Port 3001)...
start "Grand Azur - Backend API (Port 3001)" cmd /k "cd /d "%~dp0hotel-api" && npm start"

echo [2/3] Starting Frontend Dashboard (Port 5173)...
start "Grand Azur - Frontend UI (Port 5173)" cmd /k "cd /d "%~dp0front" && npm run dev"

echo [3/3] Opening Dashboard in your browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo =====================================================================
echo  Services started successfully!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo   - Health:   http://localhost:3001/api/health
echo.
echo  Keep the server terminal windows open while using the application.
echo  You can close this launcher window at any time.
echo =====================================================================
echo.
pause
