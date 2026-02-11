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
  TextField,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UpdateIcon from '@mui/icons-material/Update';
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
  const { data, loading, refreshData, updateSheetRange } = useSheetData();
  const [snackMessage, setSnackMessage] = useState<string | null>(null);
  const [editingRanges, setEditingRanges] = useState<Record<string, string>>({
    gullinbursti: 'Gullinbursti!A8:W49',
    'voyage-awards': 'Time/Voyage Awards!A1:AH34',
    'role-coin': 'Role/Coin Awards!A1:O34',
  });

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
      recordCount: data.roleCoinAwards.rowCount,
      lastUpdated: data.roleCoinAwards.lastUpdated,
    },
  ];

  const openSheet = (spreadsheetId: string) => {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    window.open(url, '_blank');
  };

  const handleRangeUpdate = async (sheetKey: 'gullinbursti' | 'voyage-awards' | 'role-coin') => {
    try {
      const newRange = editingRanges[sheetKey];
      if (sheetKey === 'gullinbursti') {
        await updateSheetRange('gullinbursti', newRange);
      } else if (sheetKey === 'voyage-awards') {
        await updateSheetRange('voyage-awards', newRange);
      }
      setSnackMessage(`✓ Range updated successfully`);
    } catch (err) {
      setSnackMessage(`✗ Failed to update range: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Just Refresh Button - No Header Card */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
          disabled={loading}
        >
          Refresh All
        </Button>
      </Box>

      {/* Sheets Table */}
      <Paper sx={{ overflow: 'hidden', mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Sheet Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Range</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Records
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedSheets.map((sheet, idx) => {
                const sheetKey = 
                  sheet.name === 'Gullinbursti' ? 'gullinbursti' :
                  sheet.name === 'LH Time/Voyages' ? 'voyage-awards' :
                  'role-coin';
                
                return (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{sheet.range.split('!')[0]}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={editingRanges[sheetKey]}
                        onChange={(e) => setEditingRanges(prev => ({ ...prev, [sheetKey]: e.target.value }))}
                        fullWidth
                        sx={{ maxWidth: 300 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={sheet.recordCount} color="primary" variant="outlined" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<UpdateIcon />}
                          onClick={() => handleRangeUpdate(sheetKey as any)}
                          sx={{ textTransform: 'none' }}
                        >
                          Update
                        </Button>
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
                );
              })}
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
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Last Updated
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Gullinbursti: {data.gullinbursti.lastUpdated ? data.gullinbursti.lastUpdated.toLocaleString() : 'Never'}
                </Typography>
                <Typography variant="body2">
                  Time/Voyage Awards: {data.voyageAwards.lastUpdated ? data.voyageAwards.lastUpdated.toLocaleString() : 'Never'}
                </Typography>
              </Stack>
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
