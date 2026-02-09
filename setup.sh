#!/bin/bash
# Setup script to help users configure the Discord Member Dashboard

echo "🚀 Discord Member Dashboard - Setup Helper"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✓ .env.local created. Please edit it with your configuration."
    echo ""
fi

# Check if credentials.json exists
if [ ! -f credentials.json ]; then
    echo "📋 Credentials file not found."
    echo "Please follow these steps:"
    echo "1. Go to https://console.cloud.google.com/"
    echo "2. Create a Service Account"
    echo "3. Download the JSON key file"
    echo "4. Save it as credentials.json in the project root"
    echo "5. Share your Google Sheet with the service account email"
    echo ""
else
    echo "✓ credentials.json found"
    echo ""
fi

# Check if Node modules are installed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✓ Setup complete!"
echo ""
echo "To start the application, run:"
echo "  Terminal 1: npm run server"
echo "  Terminal 2: npm run dev"
echo ""
echo "Or run both together:"
echo "  npm run dev:all"
echo ""
echo "Then open http://localhost:5173 in your browser"
