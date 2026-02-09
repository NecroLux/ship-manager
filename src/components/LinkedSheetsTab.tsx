import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSheetData } from '../context/SheetDataContext';
import { useState } from 'react';

interface LinkedSheet {
  name: string;
  spreadsheetId: string;
  range: string;
  recordCount: number;
  lastUpdated: Date | null;
}

export const LinkedSheetsTab = () => {
  const { data, loading, refreshData } = useSheetData();
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Define the linked sheets with their sheet names
  const linkedSheets: LinkedSheet[] = [
    {
      name: 'Gullinbursti',
      spreadsheetId: '1EiLym2gcxcxmwoTHkHD9m9MisRqC3lmjJbBUBzqlZI0',
      range: 'Gullinbursti!A8:W49',
      recordCount: data.gullinbursti.rowCount,
      lastUpdated: data.gullinbursti.lastUpdated,
    },
    {
      name: 'LH Time/Voyages',
      spreadsheetId: '1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI',
      range: 'Time/Voyage Awards!A1:AH34',
      recordCount: data.voyageAwards.rowCount,
      lastUpdated: data.voyageAwards.lastUpdated,
    },
    {
      name: 'LH Role/Coin',
      spreadsheetId: '1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI',
      range: 'Role/Coin Awards!A1:O34',
      recordCount: 0,
      lastUpdated: null,
    },
  ];

  const openSheet = (spreadsheetId: string) => {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Configuration
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage your data sources and settings
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh All
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Sheets Table with Range Field */}
      <Paper sx={{ overflow: 'hidden', mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Spreadsheet</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sheet Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cell Range</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Records
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedSheets.map((sheet, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{sheet.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {sheet.range.split('!')[0]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {sheet.range.split('!')[1]}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={sheet.recordCount} color="primary" variant="outlined" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        onClick={() => openSheet(sheet.spreadsheetId)}
                        sx={{ textTransform: 'none' }}
                      >
                        Open Sheet
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Connection Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connection Information
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Authentication
              </Typography>
              <Typography variant="body2" color="success.main">
                ✓ Service Account Connected
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Auto-Refresh
              </Typography>
              <Typography variant="body2">
                Data refreshes automatically every 5 minutes
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={!!snackMessage}
        autoHideDuration={3000}
        onClose={() => setSnackMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackMessage(null)} severity="success">
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
