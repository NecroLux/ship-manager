@echo off
REM Ship Manager - Render Deployment Verification for Windows

echo ==================================
echo Ship Manager - Render Verification
echo ==================================
echo.

set /p BACKEND_URL="Enter your Render backend URL (e.g., https://ship-manager-backend.onrender.com): "

if "%BACKEND_URL%"=="" (
    echo Error: No URL provided
    pause
    exit /b 1
)

echo.
echo Testing backend connection...
echo.

REM Test health endpoint
echo 1. Testing health check endpoint...
echo.
echo Running: curl %BACKEND_URL%/api/health
echo.

curl -s "%BACKEND_URL%/api/health"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✓ Backend is responding!
) else (
    echo.
    echo ✗ Backend not responding or error
)

echo.
echo 2. Checking credentials...
if exist "credentials.json" (
    echo ✓ credentials.json found
) else (
    echo ✗ credentials.json not found
)

echo.
echo 3. Environment configuration...
if exist ".env.local" (
    echo ✓ .env.local exists
    findstr /i "VITE_BACKEND_URL" .env.local
) else (
    echo ✗ .env.local not found
)

echo.
echo ==================================
echo Next Steps:
echo.
echo 1. Update .env.local with Render URL:
echo    VITE_BACKEND_URL=%BACKEND_URL%
echo.
echo 2. Rebuild frontend:
echo    npm run build
echo.
echo 3. Deploy to GitHub Pages:
echo    npm run deploy
echo.
echo 4. Visit: https://NecroLux.github.io/ship-manager/
echo.
pause
