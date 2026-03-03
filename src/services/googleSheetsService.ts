// Google Sheets API Service (Client)
// This service communicates with the backend to read Google Sheets securely

interface SheetData {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

interface MetadataResponse {
  spreadsheetTitle: string;
  sheets: Array<{
    name: string;
    sheetId: number;
  }>;
}

const getBackendUrl = (): string => {
  if ((import.meta as any).env.VITE_BACKEND_URL) {
    return (import.meta as any).env.VITE_BACKEND_URL;
  }
  const isDevelopment = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return isDevelopment ? 'http://localhost:5000' : 'https://ship-manager.onrender.com';
};

/**
 * Read data from a Google Sheet via backend
 * @param spreadsheetId The ID of the spreadsheet
 * @param range The range to read (e.g., "Sheet1!A1:Z100")
 * @returns SheetData with headers and values
 */
export const readGoogleSheet = async (
  spreadsheetId: string,
  range: string
): Promise<SheetData> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/sheets/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId,
        range,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      headers: data.headers || [],
      rows: data.rows || [],
      rowCount: data.rowCount || 0,
    };
  } catch (error) {
    console.error('Error reading Google Sheet:', error);
    throw new Error(
      `Failed to read Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Read multiple sheets from a spreadsheet
 * @param spreadsheetId The ID of the spreadsheet
 * @param ranges Array of ranges to read
 * @returns Map of range names to sheet data
 */
export const readMultipleSheets = async (
  spreadsheetId: string,
  ranges: string[]
): Promise<Record<string, SheetData>> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/sheets/batch-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId,
        ranges,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const result: Record<string, SheetData> = {};

    Object.entries(data).forEach(([key, value]: [string, any]) => {
      result[key] = {
        headers: value.headers || [],
        rows: value.rows || [],
        rowCount: value.rowCount || 0,
      };
    });

    return result;
  } catch (error) {
    console.error('Error reading multiple Google Sheets:', error);
    throw new Error(
      `Failed to read Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get spreadsheet metadata (sheet names, etc.)
 * @param spreadsheetId The ID of the spreadsheet
 * @returns Sheet metadata
 */
export const getSpreadsheetMetadata = async (
  spreadsheetId: string
): Promise<MetadataResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/sheets/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error reading spreadsheet metadata:', error);
    throw new Error(
      `Failed to read spreadsheet metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Check if backend is available
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// ==================== WRITE OPERATIONS ====================

interface WriteResult {
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

/**
 * Write/update cells in a Google Sheet via backend
 * @param spreadsheetId The ID of the spreadsheet
 * @param range The range to write to (e.g., "Sheet1!B5" for a single cell, or "Sheet1!B5:D5" for a row)
 * @param values 2D array of values — [[row1col1, row1col2], [row2col1, row2col2]]
 * @returns WriteResult with update stats
 */
export const writeGoogleSheet = async (
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<WriteResult> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/sheets/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId,
        range,
        values,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    throw new Error(
      `Failed to write to Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
