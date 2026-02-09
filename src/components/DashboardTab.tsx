import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import { useSheetData } from '../context/SheetDataContext';

export const DashboardTab = () => {
  const { data, loading, error, refreshData } = useSheetData();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Voyage Awards Dashboard
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {data.rowCount} total records
                {data.lastUpdated && ` • Last updated: ${data.lastUpdated.toLocaleTimeString()}`}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" icon={<ErrorIcon />}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {data.rowCount === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No data available. Check that the spreadsheet is properly configured.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  {data.headers.map((header, idx) => (
                    <TableCell key={idx} sx={{ fontWeight: 'bold' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.slice(0, 50).map((row, rowIdx) => (
                  <TableRow key={rowIdx} hover>
                    {data.headers.map((header, cellIdx) => (
                      <TableCell key={cellIdx}>
                        {row[header] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {data.rowCount > 50 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                Showing 50 of {data.rowCount} records
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
