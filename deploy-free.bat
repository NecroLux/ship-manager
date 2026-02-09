@echo off
REM Ship Manager - Free Deployment Helper for Windows
REM This script helps you deploy to Render.com or Railway for free

echo ==================================
echo Ship Manager - Free Deployment
echo ==================================
echo.
echo This script will help you deploy the backend for free.
echo.
echo Prerequisites:
echo   1. You have already deployed the frontend to GitHub Pages
echo   2. You have a credentials.json file in the project root
echo   3. You have a GitHub account
echo.
echo Deployment Options:
echo   1. Render.com (completely free, no credit card)
echo   2. Railway (free $5/month credit)
echo   3. Your Machine (no cloud cost, run locally)
echo.
echo ==================================
echo.

REM Check if credentials.json exists
if not exist "credentials.json" (
    echo Error: credentials.json not found!
    echo.
    echo You need to:
    echo 1. Download your service account JSON from Google Cloud Console
    echo 2. Save it as 'credentials.json' in the project root
    echo 3. See SETUP_GUIDE.md for detailed instructions
    echo.
    pause
    exit /b 1
)

echo √ Found credentials.json
echo.

REM Display file size as proxy for validity
for %%A in (credentials.json) do (
    echo Credentials file size: %%~zA bytes
)

echo.
echo Quick Deployment Guide:
echo.
echo OPTION 1 - Render.com (Recommended)
echo   1. Go to https://render.com
echo   2. Click "Get Started"
echo   3. Sign up with GitHub
echo   4. Click "New +" ^> "Web Service"
echo   5. Select your ship-manager repo
echo   6. Fill in:
echo      - Name: ship-manager-backend
echo      - Build Command: npm install
echo      - Start Command: npm run server
echo      - Plan: Free
echo   7. Add Environment Variable:
echo      - Key: GOOGLE_SERVICE_ACCOUNT_JSON
echo      - Value: (contents of credentials.json)
echo   8. Click "Create Web Service"
echo.
echo OPTION 2 - Railway
echo   1. Go to https://railway.app
echo   2. Click "Start Project"
echo   3. Connect GitHub
echo   4. Select this repo
echo   5. Add GOOGLE_SERVICE_ACCOUNT_JSON env var
echo   6. Deploy!
echo.
echo OPTION 3 - Local (Your Machine)
echo   Run: npm run server
echo   (Backend runs on your computer)
echo.
echo After deploying the backend:
echo   1. Get your backend URL (e.g., https://ship-manager-backend.onrender.com)
echo   2. Edit .env.local and update:
echo      VITE_BACKEND_URL=https://your-backend-url.com
echo   3. Run: npm run build
echo   4. Run: npm run deploy
echo.
echo For full instructions, open: FREE_DEPLOYMENT.md
echo.
pause
