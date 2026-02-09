#!/bin/bash

# Ship Manager - Render Deployment Verification
# This script verifies your Render deployment is working

echo "=================================="
echo "Ship Manager - Render Verification"
echo "=================================="
echo ""

# Ask for backend URL
read -p "Enter your Render backend URL (e.g., https://ship-manager-backend.onrender.com): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "Error: No URL provided"
    exit 1
fi

echo ""
echo "Testing backend connection..."
echo ""

# Test health endpoint
echo "1. Testing health check endpoint..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "   ✓ Backend is responding!"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "   ✗ Backend not responding or error"
    echo "   Response: $HEALTH_RESPONSE"
fi

echo ""
echo "2. Checking credentials..."
if [ -f "credentials.json" ]; then
    echo "   ✓ credentials.json found"
    # Check if valid JSON
    if jq empty credentials.json 2>/dev/null; then
        echo "   ✓ Valid JSON format"
    else
        echo "   ✗ Invalid JSON format"
    fi
else
    echo "   ✗ credentials.json not found"
fi

echo ""
echo "3. Environment configuration..."
if [ -f ".env.local" ]; then
    echo "   ✓ .env.local exists"
    if grep -q "VITE_BACKEND_URL" .env.local; then
        CURRENT_URL=$(grep "VITE_BACKEND_URL" .env.local | cut -d'=' -f2)
        echo "   Current VITE_BACKEND_URL: $CURRENT_URL"
    fi
else
    echo "   ✗ .env.local not found"
fi

echo ""
echo "=================================="
echo "Next Steps:"
echo ""
echo "1. Update .env.local with Render URL:"
echo "   VITE_BACKEND_URL=$BACKEND_URL"
echo ""
echo "2. Rebuild frontend:"
echo "   npm run build"
echo ""
echo "3. Deploy to GitHub Pages:"
echo "   npm run deploy"
echo ""
echo "4. Visit: https://NecroLux.github.io/ship-manager/"
echo ""

