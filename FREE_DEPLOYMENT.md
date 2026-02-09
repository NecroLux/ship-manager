# Free Deployment Guide

This guide shows you how to deploy Ship Manager completely free using only free tier services.

## Overview

| Component | Free Service | Cost | Setup Time |
|-----------|-------------|------|-----------|
| **Frontend** | GitHub Pages | **Free** ✓ | Already Done |
| **Backend** | Render (free tier) or Railway ($5 free credit) | **Free** ✓ | 5-10 min |
| **Database** | Not needed (reads from your Google Sheets) | **Free** ✓ | N/A |
| **Total Cost** | **$0/month** | | |

---

## Option 1: Deploy Backend to Render.com (Completely Free)

Render offers a genuine free tier with no credit card required.

### Step 1: Sign Up at Render

1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your GitHub account

### Step 2: Create a Web Service

1. Click "New +" button → "Web Service"
2. Select your `ship-manager` repository
3. Choose branch: `main`

### Step 3: Configure the Service

Fill in the configuration:

| Field | Value |
|-------|-------|
| **Name** | `ship-manager-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run server` |
| **Plan** | Free |

### Step 4: Add Environment Variables

1. Click "Add Environment Variable"
2. Add your Google Service Account credentials:

**Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`  
**Value:** Copy the entire contents of your `credentials.json` file (as-is, no formatting needed)

Example (don't copy this, use YOUR credentials):
```json
{"type": "service_account", "project_id": "my-project", "private_key_id": "abc123", ...}
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Render automatically builds and deploys
3. You'll see a URL like: `https://ship-manager-backend.onrender.com`
4. **⚠️ Note**: Free tier services sleep after 15 minutes of inactivity. First request takes 30-60 seconds to wake up.

### Step 6: Update Your Frontend

1. Edit `.env.local`:
   ```
   VITE_BACKEND_URL=https://ship-manager-backend.onrender.com
   PORT=5000
   ```

2. Rebuild and redeploy:
   ```bash
   npm run build
   npm run deploy
   ```

3. Your frontend at `https://NecroLux.github.io/ship-manager/` now uses the Render backend!

---

## Option 2: Upgrade to Railway ($5 Free Credit)

If Render's sleep behavior bothers you, Railway gives $5 free credit monthly (plenty for this backend).

### Quick Setup

1. Go to [railway.app](https://railway.app)
2. Click "Start Project"
3. Select GitHub repo → `ship-manager`
4. Add environment variable: `GOOGLE_SERVICE_ACCOUNT_JSON` (paste credentials)
5. Deploy (automatic)

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed steps.

**Cost**: $0 - stays within free $5/month credit

---

## Option 3: Free Local Alternative (Your Machine)

If you want zero cloud dependency:

### Windows Users

**Step 1:** Create `run-backend.bat` in your project root:
```batch
@echo off
echo Starting Ship Manager Backend...
npm run server
pause
```

**Step 2:** Set it to run automatically:
- Press `Win + R`
- Type `taskschd.msc` and press Enter
- Click "Create Basic Task"
- Name: "Ship Manager Backend"
- Trigger: "At log on"
- Action: Start program → browse to your `.bat` file
- Check "Run with highest privileges"
- Finish

**Step 3:** Backend starts automatically when you log in!

### macOS/Linux Users

**Step 1:** Install PM2:
```bash
npm install -g pm2
```

**Step 2:** Start the backend:
```bash
pm2 start npm --name "ship-manager-backend" -- run server
pm2 startup
pm2 save
```

**Step 3:** Backend starts automatically on reboot!

---

## Comparison: Which Should I Choose?

### ✅ **Best Option: Render.com Free Tier**
- **Pros**: No cost, no credit card, automatic deployments
- **Cons**: 15-min inactivity sleep (first request ~30-60 sec delay)
- **Best for**: Casual use, occasional checks

### ✅ **Better Option: Railway ($5 Free Credit)**
- **Pros**: Always-on, fast responses, generous free tier
- **Cons**: Credit card required, costs money if you exceed $5/month
- **Best for**: Regular use, consistent performance needed
- **Cost**: $0 if you stay within $5/month (you will)

### ✅ **Local Option: Your Machine**
- **Pros**: No cloud cost, full control, always available when computer is on
- **Cons**: Requires computer to be running, your internet must stay on
- **Best for**: Development, internal team use

---

## Complete Free Stack Summary

Your Ship Manager is now **completely free**:

| Layer | Service | Cost | Status |
|-------|---------|------|--------|
| 🎨 **Frontend** | GitHub Pages | Free | ✅ Deployed |
| ⚙️ **Backend** | Render OR Railway | Free | ⏳ Deploy now |
| 📊 **Data** | Your Google Sheets | Free | ✅ Connected |
| 🔐 **Auth** | Service Account | Free | ✅ Configured |
| **TOTAL** | | **$0/month** | |

---

## Deployment Checklist

- [ ] Choose deployment option (Render or Railway recommended)
- [ ] Sign up for the service
- [ ] Create a new project from GitHub repo
- [ ] Add `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable
- [ ] Deploy
- [ ] Get the backend URL (e.g., `https://ship-manager-backend.onrender.com`)
- [ ] Update `.env.local` with new `VITE_BACKEND_URL`
- [ ] Run `npm run build`
- [ ] Run `npm run deploy` (pushes to GitHub Pages)
- [ ] Test at `https://NecroLux.github.io/ship-manager/`

---

## Testing Your Deployment

Once deployed, test these URLs:

1. **Frontend**: `https://NecroLux.github.io/ship-manager/`
   - Should load the dashboard

2. **Backend Health Check**: 
   ```bash
   curl https://your-backend-url.com/api/health
   # Should return: {"status": "ok"}
   ```

3. **In the Dashboard**:
   - Go to "Linked Sheets" tab
   - Should show "Service Account Connected" ✓

---

## Troubleshooting

### "Backend not available" on first load
- **Render free tier**: This is normal - first request wakes up the service (takes 30-60 sec)
- **Solution**: Refresh the page after 60 seconds
- **To fix**: Upgrade to Railway or use local option

### "Invalid credentials" error
- Make sure your `GOOGLE_SERVICE_ACCOUNT_JSON` is pasted correctly
- It should be the entire JSON file contents as a single line
- Check that your service account has "Viewer" access to your Google Sheets

### "Deployment failed"
- Check the service logs in Render/Railway dashboard
- Make sure `npm install` completes successfully
- Verify `Start Command` is exactly: `npm run server`

---

## Next Steps

1. **Pick your deployment** (I recommend Render for free tier or Railway for better performance)
2. **Deploy the backend** using this guide
3. **Update `.env.local`** with the new backend URL
4. **Redeploy frontend** with `npm run deploy`
5. **Test everything** and you're done!

For detailed Railway setup, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

