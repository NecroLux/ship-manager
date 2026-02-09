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

export const UsersTab = () => {
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
                Gullinbursti Members
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {data.gullinbursti.rowCount} total members
                {data.gullinbursti.lastUpdated && ` • Last updated: ${data.gullinbursti.lastUpdated.toLocaleTimeString()}`}
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

      {data.gullinbursti.rowCount === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No member data available. Check that the spreadsheet is properly configured.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  {data.gullinbursti.headers.map((header, idx) => (
                    <TableCell key={idx} sx={{ fontWeight: 'bold' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.gullinbursti.rows.map((row, rowIdx) => (
                  <TableRow key={rowIdx} hover>
                    {data.gullinbursti.headers.map((header, cellIdx) => (
                      <TableCell key={cellIdx}>
                        {row[header] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Total members: {data.gullinbursti.rowCount}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
