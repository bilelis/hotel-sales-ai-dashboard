@echo off
title Push to GitHub - hotel-sales-ai-dashboard
cd /d "%~dp0"
echo ================================================================
echo    PUSHING HOTEL SALES AI DASHBOARD TO GITHUB
echo    Remote: https://github.com/bilelis/hotel-sales-ai-dashboard.git
echo ================================================================
echo.
git status
echo.
echo Pushing branch 'main' to GitHub...
echo If a GitHub sign-in window appears, click 'Sign in with your browser'.
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ================================================================
    echo [SUCCESS] Successfully pushed all files to GitHub!
    echo Check repository: https://github.com/bilelis/hotel-sales-ai-dashboard
    echo ================================================================
) else (
    echo [ERROR] Push failed. Please check your GitHub permissions or credentials.
)
echo.
pause
