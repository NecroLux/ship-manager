// Google Sheets API Service
// This service handles read-only access to Google Sheets using a service account

interface SheetData {
  values: string[][];
  headers: string[];
  rowCount: number;
}

/**
 * Initialize Google API client
 * Note: In a production app, you would load the gapi library dynamically
 * and handle authentication properly. For now, this is a placeholder structure.
 */
let gapiLoaded = false;

export const initializeGoogleApi = async (apiKey: string): Promise<void> => {
  if (gapiLoaded) {
    return;
  }

  return new Promise((resolve, reject) => {
    // Load the Google API client library
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.gapi) {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: apiKey,
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            gapiLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } else {
        reject(new Error('Failed to load Google API'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google API script'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Read data from a Google Sheet
 * @param spreadsheetId The ID of the spreadsheet
 * @param range The range to read (e.g., "Sheet1!A1:Z100")
 * @returns SheetData with headers and values
 */
export const readGoogleSheet = async (
  spreadsheetId: string,
  range: string
): Promise<SheetData> => {
  if (!gapiLoaded || !window.gapi) {
    throw new Error('Google API not initialized. Call initializeGoogleApi first.');
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.result.values || [];
    
    if (values.length === 0) {
      return {
        values: [],
        headers: [],
        rowCount: 0,
      };
    }

    // First row is headers
    const headers = values[0];
    const dataRows = values.slice(1);

    return {
      values: dataRows,
      headers,
      rowCount: dataRows.length,
    };
  } catch (error) {
    console.error('Error reading Google Sheet:', error);
    throw new Error(`Failed to read Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  if (!gapiLoaded || !window.gapi) {
    throw new Error('Google API not initialized. Call initializeGoogleApi first.');
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const result: Record<string, SheetData> = {};

    if (response.result.valueRanges) {
      response.result.valueRanges.forEach((valueRange: any, index: number) => {
        const rangeName = ranges[index];
        const values = valueRange.values || [];

        if (values.length === 0) {
          result[rangeName] = {
            values: [],
            headers: [],
            rowCount: 0,
          };
        } else {
          const headers = values[0];
          const dataRows = values.slice(1);

          result[rangeName] = {
            values: dataRows,
            headers,
            rowCount: dataRows.length,
          };
        }
      });
    }

    return result;
  } catch (error) {
    console.error('Error reading multiple Google Sheets:', error);
    throw new Error(`Failed to read Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get spreadsheet metadata (sheet names, etc.)
 * @param spreadsheetId The ID of the spreadsheet
 * @returns Sheet metadata
 */
export const getSpreadsheetMetadata = async (spreadsheetId: string) => {
  if (!gapiLoaded || !window.gapi) {
    throw new Error('Google API not initialized. Call initializeGoogleApi first.');
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });

    return response.result;
  } catch (error) {
    console.error('Error reading spreadsheet metadata:', error);
    throw new Error(`Failed to read spreadsheet metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Extend Window interface to include gapi
declare global {
  interface Window {
    gapi: any;
  }
}
