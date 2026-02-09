# GitHub Pages Configuration - GitHub Actions Setup

## Issue
GitHub Pages manual configuration wasn't working with the `/dashboard/dist/` subdirectory. We've set up an automated GitHub Actions workflow instead.

## What's Changed

✅ Created GitHub Actions workflow (`.github/workflows/deploy-dashboard.yml`)
✅ Updated Vite config to use `/ship-manager/` as base path
✅ Workflow automatically builds and deploys on every push to `main`

## One-Time GitHub Configuration

1. Go to: https://github.com/NecroLux/ship-manager/settings/pages
2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions" (not "Deploy from a branch")
3. The workflow will automatically handle building and deploying

## What Happens Now

1. You push changes to `main` branch
2. GitHub Actions automatically:
   - Checks out your code
   - Installs dependencies
   - Builds the dashboard with `npm run build`
   - Deploys to GitHub Pages

3. Your app appears at: **https://NecroLux.github.io/ship-manager/**

## To Deploy

Simply push your changes:

```bash
npm run build  # Build locally to test
npm run deploy # Push to GitHub (Actions will handle the rest)
```

Or just use your normal git workflow:

```bash
git add .
git commit -m "Your message"
git push origin main
```

## Monitor Deployment

- Go to: https://github.com/NecroLux/ship-manager/actions
- Watch the "Deploy Dashboard to GitHub Pages" workflow
- Wait for the green checkmark ✅
- Your changes are live!

## Troubleshooting

**Workflow not running?**
- Check GitHub Pages settings are set to "GitHub Actions"
- Verify workflow file exists at `.github/workflows/deploy-dashboard.yml`

**Still white screen?**
- Clear browser cache: `Ctrl+Shift+R`
- Check Actions tab for build errors
- Ensure you followed the configuration above
