#!/bin/bash

# Ship Manager - Free Deployment Helper
# This script helps you deploy to Render.com for free

echo "=================================="
echo "Ship Manager - Free Deployment"
echo "=================================="
echo ""
echo "This script will help you deploy the backend to Render.com for free."
echo ""
echo "Prerequisites:"
echo "  1. You have already deployed the frontend to GitHub Pages"
echo "  2. You have a credentials.json file in the project root"
echo "  3. You have a GitHub account"
echo ""
echo "Steps:"
echo "  1. Sign up at https://render.com (use GitHub sign-in)"
echo "  2. Create a new Web Service from your GitHub repo"
echo "  3. Use these settings:"
echo "     - Build Command: npm install"
echo "     - Start Command: npm run server"
echo "  4. Add environment variable:"
echo "     - Key: GOOGLE_SERVICE_ACCOUNT_JSON"
echo "     - Value: (paste your credentials.json contents)"
echo ""
echo "=================================="
echo ""

# Check if credentials.json exists
if [ ! -f "credentials.json" ]; then
    echo "❌ Error: credentials.json not found!"
    echo ""
    echo "You need to:"
    echo "1. Download your service account JSON from Google Cloud Console"
    echo "2. Save it as 'credentials.json' in the project root"
    echo "3. See SETUP_GUIDE.md for detailed instructions"
    exit 1
fi

echo "✓ Found credentials.json"
echo ""

# Show credentials content preview (first 50 chars)
CREDS_PREVIEW=$(head -c 50 credentials.json)
echo "Credentials file preview: $CREDS_PREVIEW..."
echo ""

echo "Next steps:"
echo "1. Open https://render.com"
echo "2. Sign in with GitHub"
echo "3. Create new Web Service from your ship-manager repo"
echo ""
echo "For full instructions, see: FREE_DEPLOYMENT.md"
echo ""

