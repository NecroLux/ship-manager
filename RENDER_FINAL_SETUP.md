# Render Deployment - Final Setup Steps

Congratulations! Your backend is deployed on Render. Now let's connect it to your frontend.

## Step 1: Get Your Render Backend URL

1. Log in to [render.com](https://render.com)
2. Go to your "ship-manager-backend" service
3. Copy the URL from the top (looks like: `https://ship-manager-backend-xxxxx.onrender.com`)

**Keep this URL handy - you'll need it for the next step.**

## Step 2: Update Frontend Configuration

Edit your `.env.local` file and update the `VITE_BACKEND_URL`:

**Before:**
```
VITE_BACKEND_URL=http://localhost:5000
PORT=5000
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
```

**After:**
```
VITE_BACKEND_URL=https://your-render-url.onrender.com
PORT=5000
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
```

Replace `your-render-url.onrender.com` with your actual Render URL.

## Step 3: Verify the Connection

**Option A - Using the verification script:**

**Windows:**
```bash
verify-render.bat
```

**macOS/Linux:**
```bash
bash verify-render.sh
```

**Option B - Manual test:**

```bash
# Test if your backend is responding
curl https://your-render-url.onrender.com/api/health

# Should return: {"status": "ok"}
```

## Step 4: Rebuild and Deploy Frontend

```bash
# Build the frontend with the new backend URL
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Step 5: Test Everything

1. Open your live dashboard: https://NecroLux.github.io/ship-manager/
2. Navigate to the **"Linked Sheets"** tab
3. You should see:
   - ✓ "Service Account Connected"
   - Voyage Awards and Gullinbursti sheet info
4. Click **"Refresh All"** button
5. Check that it loads data successfully

## ⚠️ Important Notes About Render Free Tier

### Sleep Behavior
- Render free services go to sleep after **15 minutes of inactivity**
- The first request **wakes up the service** (takes 30-60 seconds)
- Subsequent requests are normal speed

### How to Handle Sleep
- **First access after inactivity**: Page might take 30-60 sec to load
- **Solution 1**: Refresh after waiting
- **Solution 2**: Add a "warm-up" by hitting the backend immediately
- **Solution 3**: Upgrade to Railway for always-on performance

### Logs
If something goes wrong, check Render logs:
1. Go to render.com dashboard
2. Click on "ship-manager-backend" service
3. Click "Logs" to see what's happening

## Troubleshooting

### "Backend not available" in the dashboard
1. Make sure `.env.local` has the correct Render URL
2. Rebuild: `npm run build`
3. Deploy: `npm run deploy`
4. Wait 60 seconds (might be waking up)
5. Refresh the page

### "Invalid credentials" error
1. Check that Render has the `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable
2. Make sure the JSON is pasted correctly (not truncated)
3. Verify your Google Sheet is shared with the service account email

### Still not working?
1. Run `verify-render.bat` (Windows) or `bash verify-render.sh` (Mac/Linux)
2. Check Render dashboard logs
3. Make sure frontend is rebuilt: `npm run build`
4. Make sure frontend is deployed: `npm run deploy`

## Summary

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✓ Deployed | https://NecroLux.github.io/ship-manager/ |
| Backend | ✓ Deployed | https://your-render-url.onrender.com |
| Data | ✓ Connected | Your Google Sheets |
| Cost | ✓ Free | $0/month |

You're all set! 🎉

