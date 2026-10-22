@echo off
title Grand Azur Hotel Management - Stopper
cd /d "%~dp0"

echo =====================================================================
echo           STOPPING GRAND AZUR SERVICES (PORTS 3001 & 5173)
echo =====================================================================
echo.

powershell -NoProfile -Command ^
    "Get-NetTCPConnection -LocalPort 3001, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('[OK] Stopped process on port ' + $_.LocalPort) }"

echo.
echo All services stopped.
timeout /t 2 /nobreak >nul
exit
