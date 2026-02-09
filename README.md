# Discord Member Dashboard

A React-based dashboard for monitoring and managing Discord server members with Google Sheets integration and report export functionality.

## Features

- 📊 **Dashboard Tab**: Overview and quick stats
- 👥 **Users Tab**: Import and manage Discord members
- 📋 **Review Tab**: Read-only access to Google Sheets data via service account
- 📤 **Export Tab**: Export reports in PDF, Excel, and Word formats
- 🌓 **Dark/Light Mode**: Full theme support with Material-UI
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Material-UI
- **Backend**: Express.js, Google Sheets API
- **Build Tools**: TypeScript, ESLint
- **Deployment**: GitHub Pages + GitHub Actions

## Prerequisites

- Node.js 18+ and npm
- A Google Cloud project with Google Sheets API enabled
- A Google Service Account with appropriate permissions

## Setup Instructions

### Quick Start (Automated)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

### Manual Setup

#### 1. Clone and Install Dependencies

```bash
git clone https://github.com/NecroLux/ship-manager.git
cd ship-manager
npm install
```

#### 2. Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Enter a service account name (e.g., "discord-dashboard")
   - Click "Create and Continue"
   - Skip optional steps, click "Done"
5. Create a JSON Key:
   - Click on the newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Save the downloaded file as `credentials.json` in the project root

#### 3. Configure Environment Variables

1. Create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and configure the credentials path (default is already set):
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
   PORT=5000
   VITE_BACKEND_URL=http://localhost:5000
   ```

#### 4. Share Your Google Sheet with the Service Account

1. Open the `credentials.json` file you downloaded
2. Find the `client_email` value (looks like: `my-service-account@my-project.iam.gserviceaccount.com`)
3. Open your Google Sheet in a browser
4. Click the "Share" button in the top-right
5. Paste the service account email and select "Viewer" permission
6. Click "Share" (you can uncheck the notification email box)

#### 5. Run the Application

**Option A: Run Both Frontend and Backend Together** (Recommended)

```bash
npm run dev:all
```

Then open http://localhost:5173 in your browser

**Option B: Run Frontend and Backend Separately**

Terminal 1 - Start the backend:
```bash
npm run server
```

Terminal 2 - Start the frontend:
```bash
npm run dev
```

Then open http://localhost:5173

#### 6. Use the Dashboard

1. Go to the **Review** tab
2. Wait for the backend health check to complete (you should see "Backend server is connected")
3. Enter your **Spreadsheet ID** (from the URL: `docs.google.com/spreadsheets/d/SPREADSHEET_ID`)
4. Enter the **Range** (e.g., `Sheet1!A1:Z1000`)
5. Click **"Read Sheet"** to fetch and display the data

## Troubleshooting

### Error: "Backend server is not available"

1. Make sure the backend is running:
   ```bash
   npm run server
   ```
2. Check that it's accessible at `http://localhost:5000`
3. Check backend logs for detailed error messages
4. Make sure `.env.local` file exists with `GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json`

### Error: "GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable not set"

1. Verify `.env.local` file exists in the project root
2. Check that it contains: `GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json`
3. Verify `credentials.json` file exists in the project root
4. Restart the backend server: `npm run server`

### Error: "Credentials file not found"

1. Download your service account JSON key from Google Cloud Console
2. Save it in the project root folder and name it `credentials.json`
3. Make sure it's not inside any subdirectories
4. Verify the file contains valid JSON

### Error: "Permission Denied / Access Denied"

1. Open your service account's JSON file and find the `client_email` value
2. Open your Google Sheet
3. Click "Share" and ensure the service account email is added with "Viewer" permissions
4. Wait a moment for permissions to propagate

### Error: "Spreadsheet not found / Invalid range"

1. Verify the Spreadsheet ID is correct (from the URL)
2. Check the range format: `SheetName!A1:Z1000`
3. Ensure the range is within the sheet's bounds
4. Try using a smaller range first: `Sheet1!A1:A100`

## API Endpoints

The backend provides the following endpoints:

### Health Check
- **GET** `/api/health`
  - Returns `{ status: "ok" }`

### Read Single Sheet
- **POST** `/api/sheets/read`
  - Body: `{ spreadsheetId, range }`
  - Returns: `{ headers, rows, rowCount }`

### Read Multiple Sheets
- **POST** `/api/sheets/batch-read`
  - Body: `{ spreadsheetId, ranges: [array] }`
  - Returns: `{ rangeName: { headers, rows, rowCount } }`

### Get Metadata
- **POST** `/api/sheets/metadata`
  - Body: `{ spreadsheetId }`
  - Returns: `{ spreadsheetTitle, sheets: [{ name, sheetId }] }`

## Security

- The service account credentials are kept server-side only
- The frontend communicates with the backend, never directly with Google APIs
- API credentials should **never** be committed to git
- `.gitignore` is configured to exclude `credentials.json` and `.env.local`

## File Structure

```
ship-manager/
├── src/
│   ├── components/
│   │   └── GoogleSheetsViewer.tsx
│   ├── services/
│   │   └── googleSheetsService.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts
│   └── index.css
├── server/
│   └── server.ts
├── .env.local (NOT committed - create from .env.local.example)
├── credentials.json (NOT committed - from Google Cloud)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── setup.bat (Windows setup helper)
└── setup.sh (macOS/Linux setup helper)
```

## Available Scripts

- `npm run dev` - Start frontend dev server (Vite)
- `npm run server` - Start backend server (Express)
- `npm run dev:all` - Run frontend and backend together
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## Deployment

### 🎉 **Completely Free Deployment**

Both frontend and backend can be deployed completely free using free tier services!

**[📖 See Free Deployment Guide →](./FREE_DEPLOYMENT.md)**

| Component | Service | Cost | Status |
|-----------|---------|------|--------|
| **Frontend** | GitHub Pages | Free | ✅ Auto-deployed |
| **Backend** | Render OR Railway | Free | ⏳ Follow guide |
| **Data** | Your Google Sheets | Free | ✅ Connected |
| **Total** | | **$0/month** | |

### Quick Deployment Steps

1. **Choose your backend service**:
   - **Render.com** (truly free, some inactivity sleep)
   - **Railway** (free $5/month credit, no sleep)
   - **Your Machine** (local, always-on, no cloud cost)

2. **Deploy the backend** (5-10 minutes):
   - [Full guide with screenshots →](./FREE_DEPLOYMENT.md)

3. **Update frontend**:
   ```bash
   # Edit .env.local with your new backend URL
   VITE_BACKEND_URL=https://your-backend-url.com
   
   # Rebuild and deploy
   npm run build
   npm run deploy
   ```

### Frontend: GitHub Pages (Already Done)

The frontend is automatically deployed to GitHub Pages when you push to the `main` branch.

**Live Site**: https://NecroLux.github.io/ship-manager/

### Backend: Always-On Server

The backend must run 24/7. Three completely free options:

#### Option 1: Render.com (Recommended)
- Sign up free at [render.com](https://render.com)
- Connect GitHub repo → automatic deployment
- Free tier includes one web service
- **Cost**: $0/month
- **Note**: Service sleeps after 15 min inactivity (wakes on first request)

[Render setup guide →](./FREE_DEPLOYMENT.md#option-1-deploy-backend-to-rendercom-completely-free)

#### Option 2: Railway
- Free $5/month credit (more than enough)
- Always-on (no sleep)
- Automatic GitHub deployments

[Railway setup guide →](./RAILWAY_DEPLOYMENT.md)

#### Option 3: Local (Your Machine)
- No cloud cost
- Runs automatically at login (Windows/Mac)
- Requires computer to be on

[Local setup guide →](./FREE_DEPLOYMENT.md#option-3-free-local-alternative-your-machine)

## Future Features

- Discord API integration for automatic member sync
- Update functionality for Google Sheets
- Advanced filtering and search
- Member statistics and analytics
- Scheduled exports
- User authentication

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
