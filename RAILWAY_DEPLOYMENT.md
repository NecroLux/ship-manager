# Railway Deployment Guide

This guide explains how to deploy the Ship Manager backend server to Railway for 24/7 availability.

## Why Railway?

- **Free tier**: $5 credit/month (more than enough for this backend)
- **Auto-deployment**: Deploys automatically when you push to GitHub
- **Always on**: Server runs continuously
- **Simple setup**: Takes 5 minutes

## Step 1: Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start Project"
3. Sign in with GitHub (authorize Railway to access your repos)

## Step 2: Create a New Project

1. Click "New Project" → "Deploy from GitHub repo"
2. Select your `NecroLux/ship-manager` repository
3. Railway will scan and find the `server/server.ts` file

## Step 3: Configure Environment Variables

Railway will prompt you to add environment variables. Add:

```
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
PORT=3000
```

## Step 4: Upload Service Account Credentials

1. In Railway dashboard, go to **Variables**
2. Add a new variable for your service account credentials:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value**: Copy the entire contents of your `credentials.json` file (as a single-line JSON string or paste directly)

3. Update the backend to read from this environment variable instead of the file

## Step 5: Deploy

1. Click the "Deploy" button
2. Railway automatically builds and deploys
3. You'll get a public URL like `https://ship-manager-prod.up.railway.app`

## Step 6: Update Frontend Configuration

Once deployed, update your `.env.local`:

```
VITE_BACKEND_URL=https://ship-manager-prod.up.railway.app
PORT=5000
```

And commit this change so it's used in production builds.

## Alternative: Render.com

If you prefer Render:

1. Go to [render.com](https://render.com)
2. Connect GitHub
3. Create new "Web Service"
4. Select `ship-manager` repo
5. Set Build Command: `npm install && npm run build:server`
6. Set Start Command: `npm run server`
7. Add environment variables same as Railway
8. Deploy

## Alternative: Keep-Alive on Your Machine

If you prefer to keep it local but running always:

### Windows (Task Scheduler)

1. Create a `.bat` file at `C:\run-backend.bat`:
```batch
@echo off
cd C:\Users\chips\OneDrive\Documents\ship-manager
npm run server
```

2. Open Task Scheduler
3. Create Basic Task → "Ship Manager Backend"
4. Trigger: "At log on" (your user account)
5. Action: Start program → `C:\run-backend.bat`
6. Check "Run with highest privileges"
7. Finish

The backend will start automatically every time you log in.

### macOS/Linux

Create a systemd service or use `pm2`:

```bash
npm install -g pm2
pm2 start npm --name "ship-manager-backend" -- run server
pm2 startup
pm2 save
```

## Testing Your Deployment

Once deployed, test the backend:

```bash
# Replace with your Railway URL
curl https://your-railway-url.up.railway.app/api/health
```

You should get:
```json
{"status": "ok"}
```

## Monitoring

- **Railway Dashboard**: View logs, resource usage, and restart the app
- **Render Dashboard**: Similar monitoring features
- **Alerts**: Both platforms notify you of deployment failures

## Cost

- **Railway**: ~$0.10/day for this backend (within free tier)
- **Render**: Free tier available with limitations, paid plans start at $7/month
- **Heroku**: Paid only (~$7/month minimum)

---

## Next Steps

1. Choose a deployment platform (Railway recommended)
2. Follow the setup steps above
3. Test the connection from the dashboard
4. Update `.env.local` with the new backend URL
5. Deploy frontend to GitHub Pages

