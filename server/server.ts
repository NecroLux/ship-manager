import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .env.local or .env in the project root
dotenv.config({ path: path.resolve(projectRoot, '.env.local') });
dotenv.config({ path: path.resolve(projectRoot, '.env') });

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== SHARED STATE (file-persisted) ====================
// All localStorage-equivalent data is stored here so every user sees the same state.

const STATE_FILE = path.resolve(projectRoot, 'data', 'shared-state.json');

// Ensure data directory exists
const dataDir = path.dirname(STATE_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory cache of the state
let sharedState: Record<string, any> = {};

// Load from disk on startup
const loadState = () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      sharedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      console.log('✅ Shared state loaded from disk');
    } else {
      sharedState = {};
      console.log('📝 No shared state file found — starting fresh');
    }
  } catch (err) {
    console.error('⚠️ Error loading shared state:', err);
    sharedState = {};
  }
};

// Save to disk (debounced)
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const persistState = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState, null, 2), 'utf-8');
    } catch (err) {
      console.error('⚠️ Error saving shared state:', err);
    }
  }, 500); // Debounce 500ms to batch rapid writes
};

// Load state at startup
loadState();

// GET /api/state/:key — read a state bucket
app.get('/api/state/:key', (req: Request, res: Response) => {
  const key = req.params.key as string;
  res.json({ key, value: sharedState[key] ?? null });
});

// PUT /api/state/:key — write a state bucket
app.put('/api/state/:key', (req: Request, res: Response) => {
  const key = req.params.key as string;
  const { value } = req.body;
  sharedState[key] = value;
  persistState();
  res.json({ key, ok: true });
});

// GET /api/state — read ALL state (for initial load)
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(sharedState);
});

// Health check endpoint for Render
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Google Sheets API setup with service account
const getAuthClient = async () => {
  // First, try to get credentials from environment variable (for cloud deployment)
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      return auth;
    } catch (err) {
      console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', err);
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format');
    }
  }

  // Fall back to file-based credentials (for local development)
  const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  
  if (!credentialsPath) {
    console.error('Error: Neither GOOGLE_SERVICE_ACCOUNT_JSON nor GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable is set');
    console.error('For cloud deployment: set GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
    console.error('For local development: create a .env.local file with: GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials.json');
    throw new Error('No credentials configured');
  }

  // Resolve the credentials path relative to the project root
  const resolvedPath = path.resolve(projectRoot, credentialsPath);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Credentials file not found at ${resolvedPath}`);
    console.error(`Please ensure you have downloaded your service account key and placed it at: ${resolvedPath}`);
    throw new Error(`Credentials file not found at ${resolvedPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return auth;
};

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Endpoint to read a single sheet
app.post('/api/sheets/read', async (req: Request, res: Response) => {
  try {
    const { spreadsheetId, range } = req.body;

    if (!spreadsheetId || !range) {
      return res.status(400).json({ error: 'Missing spreadsheetId or range' });
    }

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    if (values.length === 0) {
      return res.json({
        headers: [],
        rows: [],
        rowCount: 0,
      });
    }

    const headers = values[0];
    const rows = values.slice(1);

    res.json({
      headers,
      rows,
      rowCount: rows.length,
    });
  } catch (error) {
    console.error('Error reading sheet:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Full error details:', errorMessage);
    res.status(500).json({
      error: 'Failed to read sheet',
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Endpoint to read multiple sheets
app.post('/api/sheets/batch-read', async (req: Request, res: Response) => {
  try {
    const { spreadsheetId, ranges } = req.body;

    if (!spreadsheetId || !ranges || !Array.isArray(ranges)) {
      return res.status(400).json({ error: 'Missing spreadsheetId or ranges' });
    }

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const result: Record<string, any> = {};

    if (response.data.valueRanges) {
      response.data.valueRanges.forEach((valueRange: any, index: number) => {
        const rangeName = ranges[index];
        const values = valueRange.values || [];

        if (values.length === 0) {
          result[rangeName] = {
            headers: [],
            rows: [],
            rowCount: 0,
          };
        } else {
          const headers = values[0];
          const rows = values.slice(1);

          result[rangeName] = {
            headers,
            rows,
            rowCount: rows.length,
          };
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error reading multiple sheets:', error);
    res.status(500).json({
      error: 'Failed to read sheets',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Endpoint to get spreadsheet metadata
app.post('/api/sheets/metadata', async (req: Request, res: Response) => {
  try {
    const { spreadsheetId } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Missing spreadsheetId' });
    }

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetNames = response.data.sheets?.map((sheet) => ({
      name: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
    })) || [];

    res.json({
      spreadsheetTitle: response.data.properties?.title,
      sheets: sheetNames,
    });
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({
      error: 'Failed to get metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log('✅ All endpoints ready and operational');
  console.log('Available endpoints:');
  console.log('  POST /api/sheets/read - Read a single sheet');
  console.log('  POST /api/sheets/batch-read - Read multiple sheets');
  console.log('  POST /api/sheets/metadata - Get spreadsheet metadata');
  console.log('  GET  /api/state - Read all shared state');
  console.log('  GET  /api/state/:key - Read a state bucket');
  console.log('  PUT  /api/state/:key - Write a state bucket');
});
