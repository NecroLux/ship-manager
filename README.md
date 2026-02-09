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

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/NecroLux/ship-manager.git
cd ship-manager
npm install
```

### 2. Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Sheets API**:
   - Go to APIs & Services > Library
   - Search for "Google Sheets API"
   - Click Enable
4. Create a Service Account:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"
   - Skip the optional steps and click "Done"
5. Create a JSON Key:
   - Go to the service account you just created
   - Click on the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - A JSON file will download automatically

### 3. Configure Environment Variables

1. Copy the `credentials.json` file you downloaded to the project root:
   ```bash
   cp ~/Downloads/your-service-account-key.json ./credentials.json
   ```

2. Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` and set the path to your credentials:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json
   PORT=5000
   VITE_BACKEND_URL=http://localhost:5000
   ```

### 4. Share Your Google Sheet with the Service Account

1. Open `credentials.json` and find the `client_email` value
2. Open your Google Sheet
3. Click "Share" and add the service account email (e.g., `my-service-account@my-project.iam.gserviceaccount.com`)
4. Give it at least "Viewer" permissions

### 5. Run the Application

#### Option A: Run Frontend and Backend Separately

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend (dev mode):
```bash
npm run dev
```

Then open http://localhost:5173

#### Option B: Run Both Together

```bash
npm run dev:all
```

This runs both the frontend (Vite dev server) and backend (Express server) concurrently.

### 6. Use the Dashboard

1. Go to the **Review** tab
2. Wait for the backend health check to complete
3. Enter your **Spreadsheet ID** (from the URL: `docs.google.com/spreadsheets/d/SPREADSHEET_ID`)
4. Enter the **Range** (e.g., `Sheet1!A1:Z1000`)
5. Click **"Read Sheet"** to fetch and display the data

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
- `.gitignore` is configured to exclude `credentials.json`

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
├── .env.example
├── .env.local (NOT committed)
├── credentials.json (NOT committed)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Available Scripts

- `npm run dev` - Start frontend dev server (Vite)
- `npm run server` - Start backend server (Express)
- `npm run dev:all` - Run frontend and backend together
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## Troubleshooting

### Backend is not available / Cannot connect

1. Make sure the backend is running: `npm run server`
2. Check that the backend is accessible at `http://localhost:5000`
3. Verify CORS is enabled (it should be by default)

### Permission Denied / Access Denied

1. Verify the service account email has been added to your Google Sheet
2. Check that it has at least "Viewer" permissions
3. Ensure the `credentials.json` file exists and is readable
4. Check the backend logs for more details

### Spreadsheet not found / Invalid range

1. Verify the Spreadsheet ID is correct (from the URL)
2. Check the range format: `SheetName!A1:Z1000`
3. Ensure the range is within the bounds of the sheet

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
