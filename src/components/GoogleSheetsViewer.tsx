import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ErrorIcon from '@mui/icons-material/Error';
import { initializeGoogleApi, readGoogleSheet, getSpreadsheetMetadata } from '../services/googleSheetsService';

interface SheetViewerProps {
  apiKey?: string;
  onDataLoaded?: (data: any) => void;
}

interface LoadedSheet {
  name: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export const GoogleSheetsViewer = ({ apiKey, onDataLoaded }: SheetViewerProps) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A1:Z1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSheets, setLoadedSheets] = useState<LoadedSheet[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleInitializeApi = async () => {
    if (!apiKey) {
      setError('API Key is required. Please set it in your environment configuration.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await initializeGoogleApi(apiKey);
      setIsInitialized(true);
    } catch (err) {
      setError(`Failed to initialize Google Sheets API: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadSheet = async () => {
    if (!spreadsheetId) {
      setError('Spreadsheet ID is required');
      return;
    }

    if (!isInitialized) {
      setError('Please initialize the Google Sheets API first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await readGoogleSheet(spreadsheetId, sheetRange);

      const newSheet: LoadedSheet = {
        name: sheetRange,
        headers: data.headers,
        rows: data.values,
        rowCount: data.rowCount,
      };

      setLoadedSheets([...loadedSheets, newSheet]);
      onDataLoaded?.(newSheet);
    } catch (err) {
      setError(`Failed to read sheet: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMetadata = async () => {
    if (!spreadsheetId) {
      setError('Spreadsheet ID is required');
      return;
    }

    if (!isInitialized) {
      setError('Please initialize the Google Sheets API first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const metadata = await getSpreadsheetMetadata(spreadsheetId);
      const sheetNames = metadata.sheets.map((sheet: any) => sheet.properties.title);
      setError(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);
    } catch (err) {
      setError(`Failed to get metadata: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSheets = () => {
    setLoadedSheets([]);
    setError(null);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Google Sheets Configuration
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="API Key"
              type="password"
              variant="outlined"
              placeholder="Enter your Google API key"
              value={apiKey || ''}
              disabled
              helperText="API Key should be set in environment configuration"
              size="small"
            />

            {!isInitialized && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleInitializeApi}
                disabled={loading || !apiKey}
              >
                {loading ? <CircularProgress size={24} /> : 'Initialize Google Sheets API'}
              </Button>
            )}

            {isInitialized && (
              <Alert severity="success">✓ Google Sheets API initialized</Alert>
            )}

            {isInitialized && (
              <>
                <TextField
                  fullWidth
                  label="Spreadsheet ID"
                  variant="outlined"
                  placeholder="e.g., 1BxiMVs0XRA5nFMXU8B4RXpLN4QBKvnpKgXYP5F3eDnM"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  size="small"
                  helperText="Copy from your Google Sheets URL"
                />

                <TextField
                  fullWidth
                  label="Range"
                  variant="outlined"
                  placeholder="e.g., Sheet1!A1:Z1000"
                  value={sheetRange}
                  onChange={(e) => setSheetRange(e.target.value)}
                  size="small"
                  helperText="Specify the sheet name and cell range to read"
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleReadSheet}
                    disabled={loading || !spreadsheetId}
                    startIcon={<CloudDownloadIcon />}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Read Sheet'}
                  </Button>

                  <Button
                    variant="outlined"
                    color="info"
                    onClick={handleGetMetadata}
                    disabled={loading || !spreadsheetId}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Get Sheet Names'}
                  </Button>

                  {loadedSheets.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClearSheets}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert
          severity={error.startsWith('Found') ? 'info' : 'error'}
          icon={error.startsWith('Found') ? undefined : <ErrorIcon />}
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loadedSheets.map((sheet, idx) => (
        <Paper key={idx} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {sheet.name} ({sheet.rowCount} rows)
          </Typography>

          {sheet.rowCount === 0 ? (
            <Typography color="textSecondary">No data found in this range</Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    {sheet.headers.map((header, idx) => (
                      <TableCell key={idx} sx={{ fontWeight: 'bold' }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sheet.rows.slice(0, 50).map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx}>{cell || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {sheet.rowCount > 50 && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Showing first 50 of {sheet.rowCount} rows
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};
