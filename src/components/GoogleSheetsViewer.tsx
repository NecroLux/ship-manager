import { useState, useEffect } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { readGoogleSheet, getSpreadsheetMetadata, checkBackendHealth } from '../services/googleSheetsService';

interface SheetViewerProps {
  onDataLoaded?: (data: any) => void;
}

interface LoadedSheet {
  name: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export const GoogleSheetsViewer = ({ onDataLoaded }: SheetViewerProps) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A1:Z1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadedSheets, setLoadedSheets] = useState<LoadedSheet[]>([]);
  const [backendReady, setBackendReady] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);

  // Check if backend is available on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        setBackendReady(isHealthy);
        if (!isHealthy) {
          setError('Backend server is not available. Please ensure the server is running on http://localhost:5000');
        }
      } catch {
        setBackendReady(false);
        setError('Unable to connect to backend server.');
      } finally {
        setCheckingBackend(false);
      }
    };

    checkBackend();
  }, []);

  const handleReadSheet = async () => {
    if (!spreadsheetId) {
      setError('Spreadsheet ID is required');
      return;
    }

    if (!backendReady) {
      setError('Backend server is not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await readGoogleSheet(spreadsheetId, sheetRange);

      const newSheet: LoadedSheet = {
        name: sheetRange,
        headers: data.headers,
        rows: data.rows,
        rowCount: data.rowCount,
      };

      setLoadedSheets([...loadedSheets, newSheet]);
      setSuccess(`✓ Successfully loaded ${newSheet.rowCount} rows from ${sheetRange}`);
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

    if (!backendReady) {
      setError('Backend server is not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const metadata = await getSpreadsheetMetadata(spreadsheetId);
      const sheetNames = metadata.sheets.map((s) => s.name).join(', ');
      setSuccess(`✓ Found ${metadata.sheets.length} sheets: ${sheetNames}`);
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
    setSuccess(null);
  };

  if (checkingBackend) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Google Sheets Configuration
          </Typography>

          <Stack spacing={2}>
            {!backendReady && (
              <Alert severity="error" icon={<ErrorIcon />}>
                Backend server is not available. Please start the server with: <code>npm run server</code>
              </Alert>
            )}

            {backendReady && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Backend server is connected
              </Alert>
            )}

            <TextField
              fullWidth
              label="Spreadsheet ID"
              variant="outlined"
              placeholder="e.g., 1BxiMVs0XRA5nFMXU8B4RXpLN4QBKvnpKgXYP5F3eDnM"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              size="small"
              disabled={!backendReady}
              helperText="Copy from your Google Sheets URL: docs.google.com/spreadsheets/d/SPREADSHEET_ID"
            />

            <TextField
              fullWidth
              label="Range"
              variant="outlined"
              placeholder="e.g., Sheet1!A1:Z1000"
              value={sheetRange}
              onChange={(e) => setSheetRange(e.target.value)}
              size="small"
              disabled={!backendReady}
              helperText="Specify the sheet name and cell range to read"
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleReadSheet}
                disabled={loading || !backendReady || !spreadsheetId}
                startIcon={<CloudDownloadIcon />}
              >
                {loading ? <CircularProgress size={24} /> : 'Read Sheet'}
              </Button>

              <Button
                variant="outlined"
                color="info"
                onClick={handleGetMetadata}
                disabled={loading || !backendReady || !spreadsheetId}
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
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
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
