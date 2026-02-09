# How to Get Your Google Service Account JSON Key

## Step-by-Step Guide

### 1. Go to Google Cloud Console

1. Open https://console.cloud.google.com/ in your browser
2. Sign in with your Google account (or create one if needed)

### 2. Create a New Project (or use existing)

1. At the top of the page, click the **Project dropdown** (currently shows "My First Project" or similar)
2. Click **"NEW PROJECT"** button
3. Enter a project name (e.g., "Discord Dashboard")
4. Click **"CREATE"**
5. Wait for the project to be created (about 1 minute)

### 3. Enable Google Sheets API

1. Once the project is created, you should see the project dashboard
2. In the search bar at the top, search for **"Google Sheets API"**
3. Click on the **Google Sheets API** result
4. Click the blue **"ENABLE"** button
5. Wait for it to enable (about 1 minute)

### 4. Create a Service Account

1. From the Google Sheets API page, click **"Create Credentials"** (top right)
2. A panel will appear asking "What data will you be accessing?"
   - Select: **"Application data"**
3. Click **"NEXT"**
4. You'll see "Create a service account"
   - **Service account name**: Enter something like `discord-dashboard` or `my-sheets-app`
   - **Service account ID**: Auto-generated (you can leave it)
   - Click **"CREATE AND CONTINUE"**
5. On the next page "Grant this service account access to project":
   - You can leave this blank and click **"CONTINUE"**
6. On the next page "Grant users access to this service account":
   - You can leave this blank and click **"DONE"**

### 5. Create and Download the JSON Key

1. You should now be on the Service Accounts page
2. Click on the service account you just created (the row with your service account name)
3. Click on the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. A dialog will appear - select **"JSON"** format
6. Click **"CREATE"**
7. **A JSON file will automatically download** to your computer (usually to Downloads folder)

The file will look something like: `your-project-abc123-def456.json`

### 6. Move the JSON File to Your Project

1. Open your file explorer
2. Find the downloaded JSON file in your Downloads folder
3. **Cut** the file (Ctrl+X)
4. Navigate to your project folder: `C:\Users\chips\OneDrive\Documents\ship-manager\`
5. **Paste** the file there (Ctrl+V)
6. **Rename** it to: `credentials.json`

Your project should now look like:
```
ship-manager/
├── credentials.json          ← Your service account key
├── .env.local
├── server/
├── src/
├── package.json
└── ... other files
```

### 7. Share Your Google Sheet with the Service Account

This is important! The service account needs permission to access your sheet.

1. Open the JSON file you just saved with a text editor (Notepad, VS Code, etc.)
2. Find the line that starts with `"client_email":`
3. Copy the email address (it looks like: `discord-dashboard@your-project.iam.gserviceaccount.com`)
4. Open your Google Sheet in a browser
5. Click the **"Share"** button (top right)
6. Paste the service account email
7. Select **"Viewer"** permission (read-only is perfect)
8. Click **"Share"** (you can uncheck "Notify people")

### 8. Test It Works

1. Open a terminal in your project folder
2. Run: `npm run server`
3. You should see: `🚀 Backend server running at http://localhost:5000`
4. In a browser, go to http://localhost:5000/api/health
5. You should see: `{"status":"ok"}`

If you see that, you're all set! ✅

## Troubleshooting

### "I can't find the Google Sheets API"

- Make sure you're in the right project (check dropdown at top)
- Make sure you searched in the API Library (not just general search)

### "The JSON file didn't download"

- Check your browser's Downloads folder
- Your browser might have blocked it - check for a download notification

### "I can't find the service account"

- Go back to Google Cloud Console
- In the left menu, click **"APIs & Services"** → **"Credentials"**
- Scroll down to "Service Accounts" section
- Your account should be listed there

### Still having issues?

Let me know:
1. What step are you stuck on?
2. What error message do you see?
3. What does your Google Cloud Console look like?

I can help you troubleshoot! 🚀
