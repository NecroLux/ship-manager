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
  Chip,
  Rating,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import { useSheetData } from '../context/SheetDataContext';

// Helper function to get compliance status
const getComplianceStatus = (complianceValue: string) => {
  if (!complianceValue) return { label: 'Unknown', color: 'default' as const, showIcon: false };
  const normalized = complianceValue.toLowerCase().trim();
  if (normalized === 'in regulations' || normalized === 'yes' || normalized === 'compliant') {
    return { label: 'In Compliance', color: 'success' as const, showIcon: true, icon: '✓' };
  }
  if (normalized === 'flagged' || normalized === 'no' || normalized === 'non-compliant') {
    return { label: 'Flagged', color: 'error' as const, showIcon: true, icon: '⚠' };
  }
  return { label: normalized, color: 'warning' as const, showIcon: false };
};

// Helper function to get rank color
const getRankColor = (rank: string) => {
  if (!rank) return '#999999';
  const rankLower = rank.toLowerCase();
  
  // Admiral/Captain colors
  if (rankLower.includes('admiral') || rankLower.includes('captain')) return '#FFD700'; // Gold
  // Officer colors
  if (rankLower.includes('commander') || rankLower.includes('lieutenant')) return '#C0C0C0'; // Silver
  // Petty Officer colors
  if (rankLower.includes('petty') || rankLower.includes('chief')) return '#CD7F32'; // Bronze
  // Sailor colors
  return '#4A90E2'; // Blue
};

export const UsersTab = () => {
  const { data, loading, error, refreshData } = useSheetData();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Parse sailor data - map from whatever columns exist in the sheet
  const sailors = data.gullinbursti.rows.map((row) => ({
    rank: row['Rank'] || row['rank'] || 'Sailor',
    name: row['Name'] || row['name'] || row['Discord Name'] || 'Unknown',
    squad: row['Squad'] || row['squad'] || row['Team'] || '-',
    compliance: row['Compliance'] || row['compliance'] || row['Status'] || 'Unknown',
    timezone: row['Timezone'] || row['timezone'] || row['TZ'] || '-',
    stars: row['Chat Activity Stars'] || row['stars'] || row['Activity'] || '0',
  }));

  const complianceStats = {
    total: sailors.length,
    compliant: sailors.filter(s => 
      s.compliance.toLowerCase().includes('regulation') || 
      s.compliance.toLowerCase() === 'yes' ||
      s.compliance.toLowerCase() === 'compliant'
    ).length,
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header Card */}
      <Card sx={{ 
        mb: 3, 
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1e3a8a 0%, #2d5a96 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white'
      }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                ⚓ Ship's Crew
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {sailors.length} crew members • {complianceStats.compliant} in compliance
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
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

      {sailors.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No crew data available. Check that the spreadsheet is properly configured.
          </Typography>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow 
                sx={{ 
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
                  '& th': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }
                }}
              >
                <TableCell sx={{ width: '15%' }}>Rank</TableCell>
                <TableCell sx={{ width: '25%' }}>Name</TableCell>
                <TableCell sx={{ width: '15%' }}>Squad</TableCell>
                <TableCell sx={{ width: '20%' }}>Compliance</TableCell>
                <TableCell sx={{ width: '15%' }}>Timezone</TableCell>
                <TableCell sx={{ width: '10%', textAlign: 'center' }}>Activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sailors.map((sailor, idx) => {
                const complianceStatus = getComplianceStatus(sailor.compliance);
                const rankColor = getRankColor(sailor.rank);
                const starCount = Math.min(5, Math.max(0, parseInt(sailor.stars) || 0));
                
                return (
                  <TableRow
                    key={idx}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      },
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {/* Rank */}
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.75,
                          borderRadius: 1,
                          backgroundColor: rankColor,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                        }}
                      >
                        {sailor.rank}
                      </Box>
                    </TableCell>

                    {/* Name */}
                    <TableCell sx={{ fontWeight: 500 }}>
                      {sailor.name}
                    </TableCell>

                    {/* Squad */}
                    <TableCell>
                      <Chip
                        label={sailor.squad}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>

                    {/* Compliance */}
                    <TableCell>
                      <Chip
                        label={`${complianceStatus.showIcon ? complianceStatus.icon + ' ' : ''}${complianceStatus.label}`}
                        color={complianceStatus.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>

                    {/* Timezone */}
                    <TableCell sx={{ fontSize: '0.9rem' }}>
                      {sailor.timezone !== '-' ? `${sailor.timezone}` : '-'}
                    </TableCell>

                    {/* Activity Stars */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Rating
                        value={starCount}
                        readOnly
                        size="small"
                        sx={{ 
                          display: 'inline-flex',
                          '& .MuiRating-iconFilled': {
                            color: '#FFD700',
                          },
                          '& .MuiRating-iconEmpty': {
                            color: theme.palette.mode === 'dark' ? '#444' : '#ddd',
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Footer Stats */}
      {sailors.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                Total Crew
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
                {sailors.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                In Compliance
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                {complianceStats.compliant}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                Flagged
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ef4444' }}>
                {sailors.length - complianceStats.compliant}
              </Typography>
            </CardContent>
          </Card>
          {data.gullinbursti.lastUpdated && (
            <Card sx={{ flex: 1, minWidth: 150 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {data.gullinbursti.lastUpdated.toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};
