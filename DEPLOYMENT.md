# Deployment Guide

## Quick Deploy to GitHub

The `npm run deploy` script handles all the heavy lifting:

```bash
npm run deploy
```

This command:
1. Stages all changes with `git add .`
2. Creates a commit with "Update dashboard" message
3. Pushes to the `main` branch on GitHub

## GitHub Pages Setup

To see your dashboard live on GitHub Pages, follow these steps:

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/NecroLux/ship-manager
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `main`
   - **Folder**: Select `/dashboard/dist`
4. Click **Save**

GitHub will now serve your built app from `https://NecroLux.github.io/ship-manager/dashboard/dist/`

### 2. Build Before Deploying

Always run this before deploying to ensure the `dist` folder is up-to-date:

```bash
npm run build
npm run deploy
```

Or use:

```bash
npm run preview  # Builds and shows preview
npm run deploy   # Deploys after confirmation
```

## What it does

```bash
git add .                                  # Stage all changes
git commit -m "Update dashboard" --allow-empty  # Create commit (empty commits allowed)
git push origin main                       # Push to GitHub
```

## Automated Workflow (Optional)

A GitHub Actions workflow has been created (`.github/workflows/deploy.yml`) that can automatically build and deploy on every push. To enable it:

1. Uncomment the workflow file if needed
2. Push any changes
3. GitHub will automatically build and deploy

## Manual Git Commands (if needed)

If you need more control, use these individual commands:

```bash
# Check status
git status

# Rebuild before committing
npm run build

# Stage specific files
git add dist/ src/App.tsx

# Commit with custom message
git commit -m "Add feature: member filtering"

# Push to GitHub
git push origin main

# View commit history
git log --oneline
```

## Workflow

1. Make changes to the code
2. Test locally with `npm run dev`
3. Build with `npm run build`
4. When ready, run `npm run deploy`
5. Changes will be pushed to GitHub automatically
6. GitHub Pages will update within 1-2 minutes

## Important Notes

- The `dist` folder is now tracked in git (removed from .gitignore)
- Always rebuild before deploying: `npm run build`
- GitHub Pages serves from `/dashboard/dist`
- Your live URL will be: `https://NecroLux.github.io/ship-manager/dashboard/dist/`

## Repository

- Repository: https://github.com/NecroLux/ship-manager
- Branch: main
- Subdirectory: dashboard/
- Deployed From: dashboard/dist/

## Troubleshooting

**White screen on GitHub Pages but preview works?**
- Make sure you ran `npm run build` before deploying
- Check that `dist/` folder is committed to git
- Verify GitHub Pages settings point to `/dashboard/dist`
- Clear browser cache and hard refresh (Ctrl+Shift+R)

**Still not showing?**
- Check GitHub Pages settings in repository Settings → Pages
- Wait 1-2 minutes for GitHub to process
- Check for errors in repository Actions tab

