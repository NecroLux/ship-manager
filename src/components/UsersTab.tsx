import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent,
  Chip,
  Rating,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  const { data, loading, refreshData } = useSheetData();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Log headers for debugging
  console.log('Gullinbursti headers:', data.gullinbursti.headers);
  console.log('Sample row:', data.gullinbursti.rows[0]);

  // Parse sailor data - flexible column matching
  const sailors = data.gullinbursti.rows.map((row) => {
    // Try to find columns by various name patterns
    const rankCol = data.gullinbursti.headers.find(h => h.toLowerCase().includes('rank')) || data.gullinbursti.headers[0];
    const nameCol = data.gullinbursti.headers.find(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('sailor') || h.toLowerCase().includes('member')) || data.gullinbursti.headers[1];
    const squadCol = data.gullinbursti.headers.find(h => h.toLowerCase().includes('squad') || h.toLowerCase().includes('team')) || data.gullinbursti.headers[2];
    const complianceCol = data.gullinbursti.headers.find(h => h.toLowerCase().includes('compliance') || h.toLowerCase().includes('status')) || data.gullinbursti.headers[3];
    const timezoneCol = data.gullinbursti.headers.find(h => h.toLowerCase().includes('timezone') || h.toLowerCase().includes('tz')) || data.gullinbursti.headers[4];
    const starsCol = data.gullinbursti.headers.find(h => h.toLowerCase().includes('activity') || h.toLowerCase().includes('star')) || data.gullinbursti.headers[5];

    return {
      rank: row[rankCol] || 'Sailor',
      name: row[nameCol] || 'Unknown',
      squad: row[squadCol] || '-',
      compliance: row[complianceCol] || 'Unknown',
      timezone: row[timezoneCol] || '-',
      stars: row[starsCol] || '0',
    };
  });

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
      {/* Refresh Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

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
