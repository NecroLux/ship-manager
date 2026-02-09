#!/bin/bash
# Script to deploy dashboard to GitHub Pages using GitHub Actions

cd dashboard

# Build the dashboard
npm run build

# Add all changes
git add .

# Commit
git commit -m "Deploy dashboard update"

# Push to main (GitHub Actions will handle deployment)
git push origin main

echo "✅ Pushed to main! GitHub Actions will now build and deploy your dashboard."
echo "📊 Check progress at: https://github.com/NecroLux/ship-manager/actions"
