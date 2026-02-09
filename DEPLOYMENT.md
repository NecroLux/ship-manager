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

## What it does

```bash
git add .                                  # Stage all changes
git commit -m "Update dashboard" --allow-empty  # Create commit (empty commits allowed)
git push origin main                       # Push to GitHub
```

## Manual Git Commands (if needed)

If you need more control, use these individual commands:

```bash
# Check status
git status

# Stage specific files
git add src/App.tsx

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
3. When ready, run `npm run deploy`
4. Changes will be pushed to GitHub automatically

## Repository

- Repository: https://github.com/NecroLux/ship-manager
- Branch: main
- Subdirectory: dashboard/

## First Time Setup (Already Done)

If you're setting up a new repository, run:

```bash
git remote add origin https://github.com/yourusername/repository-name.git
git branch -M main
git push -u origin main
```

This is already configured in this project.
