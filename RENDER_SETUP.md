# Render Backend Setup Instructions

## Problem: 0 rows showing on Linked Sheets tab

If you see 0 rows for both Voyage Awards and Gullinbursti sheets, the backend is likely missing the Google Service Account credentials.

## Solution: Add Environment Variable to Render

### Step 1: Get Your Credentials
1. Go to your Google Cloud Console
2. Download your service account key as JSON (should already be done)
3. Open the JSON file and copy its entire contents

### Step 2: Add to Render
1. Go to https://dashboard.render.com/
2. Click on the **ship-manager** service (backend)
3. Click on **Environment** (or **Settings** → **Environment**)
4. Click **Add Environment Variable**
5. Set:
   - **Key**: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value**: *Paste the entire contents of your service account JSON file*
6. Click **Save**
7. The service will automatically redeploy

### Step 3: Verify
After redeployment:
1. Go back to https://NecroLux.github.io/ship-manager/
2. Navigate to the **Linked Sheets** tab
3. Click the **Refresh** button
4. Both sheets should now show row counts instead of 0

## Alternative: Check Backend Logs
1. On Render dashboard, click the ship-manager service
2. Click **Logs** tab
3. Look for error messages like:
   - "No credentials configured"
   - "Credentials file not found"
   - "Invalid GOOGLE_SERVICE_ACCOUNT_JSON format"

## If Still Not Working
- Verify the JSON file is properly formatted (no truncation)
- Check that the credentials have access to both Google Sheets
- Restart the Render service manually by clicking **Manual Deploy**

