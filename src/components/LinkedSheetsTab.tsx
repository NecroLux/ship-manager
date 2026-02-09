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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSheetData } from '../context/SheetDataContext';

interface LinkedSheet {
  name: string;
  spreadsheetId: string;
  range: string;
  recordCount: number;
  lastUpdated: Date | null;
}

export const LinkedSheetsTab = () => {
  const { data, loading, refreshData } = useSheetData();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Define the linked sheets
  const linkedSheets: LinkedSheet[] = [
    {
      name: 'Voyage Awards',
      spreadsheetId: '1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI',
      range: 'Time/Voyage Awards!A1:O900',
      recordCount: data.voyageAwards.rowCount,
      lastUpdated: data.voyageAwards.lastUpdated,
    },
    {
      name: 'Gullinbursti',
      spreadsheetId: '1EiLym2gcxcxmwoTHkHD9m9MisRqC3lmjJbBUBzqlZI0',
      range: 'Gullinbursti!A1:W64',
      recordCount: data.gullinbursti.rowCount,
      lastUpdated: data.gullinbursti.lastUpdated,
    },
  ];

  const openSheet = (spreadsheetId: string) => {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    window.open(url, '_blank');
  };

  const getSheetUrl = (spreadsheetId: string) => {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Linked Google Sheets
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage connections to your data sources
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
                <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
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
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {sheet.range}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={sheet.recordCount} color="primary" variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>
                    {sheet.lastUpdated ? (
                      <Typography variant="caption">
                        {sheet.lastUpdated.toLocaleString()}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Never
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<OpenInNewIcon />}
                      onClick={() => openSheet(sheet.spreadsheetId)}
                      sx={{ textTransform: 'none' }}
                    >
                      Open Sheet
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Sheet Details Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {linkedSheets.map((sheet, idx) => (
          <Card key={idx}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {sheet.name}
              </Typography>

              <Stack spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Spreadsheet ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mt: 0.5 }}
                  >
                    {sheet.spreadsheetId}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Data Range
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', mt: 0.5 }}
                  >
                    {sheet.range}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Record Count
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {sheet.recordCount} rows
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Last Refreshed
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {sheet.lastUpdated ? sheet.lastUpdated.toLocaleString() : 'Never'}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<OpenInNewIcon />}
                  onClick={() => openSheet(sheet.spreadsheetId)}
                >
                  Go to Sheet
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    // Copy URL to clipboard
                    navigator.clipboard.writeText(getSheetUrl(sheet.spreadsheetId));
                  }}
                >
                  Copy URL
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Connection Info */}
      <Card sx={{ mt: 3 }}>
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
                Last System Refresh
              </Typography>
              <Typography variant="body2">
                {new Date().toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
