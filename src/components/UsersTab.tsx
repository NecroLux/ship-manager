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
  if (!complianceValue) return { label: 'Unknown', color: 'default' as const, icon: '?', status: 'unknown' };
  const normalized = complianceValue.toLowerCase().trim();
  
  // Active Duty status = Compliant
  if (normalized.includes('active') || normalized.includes('duty') || 
      normalized === 'within regulations' || normalized === 'yes' || normalized === 'compliant') {
    return { label: 'Compliant', color: 'success' as const, icon: '✓', status: 'compliant' };
  }
  
  // LOA statuses (e.g., "LOA-1", "LOA-2") = Requires Attention
  if (normalized.includes('loa') || normalized.includes('requires attention') || normalized.includes('warning')) {
    return { label: 'Requires Attention', color: 'warning' as const, icon: '~', status: 'attention-required' };
  }
  
  // Flagged/Action required
  if (normalized === 'flagged' || normalized === 'no' || normalized === 'non-compliant' || normalized === 'requires action') {
    return { label: 'Requires Action', color: 'error' as const, icon: '✕', status: 'action-required' };
  }
  
  return { label: normalized, color: 'default' as const, icon: '?', status: 'unknown' };
};

// Helper function to get rank color and styling
const getRankColor = (rank: string) => {
  if (!rank) return { color: '#999999', bgColor: 'rgba(153, 153, 153, 0.1)' };
  const rankLower = rank.toLowerCase();
  
  // Lt. Commander - Red
  if (rankLower.includes('commander') && !rankLower.includes('petty')) {
    return { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' }; // Red
  }
  // Midshipwoman - Pink
  if (rankLower.includes('midship')) {
    return { color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.1)' }; // Pink
  }
  // SCPO - Purple
  if (rankLower.includes('scpo') || (rankLower.includes('senior') && rankLower.includes('petty'))) {
    return { color: '#A855F7', bgColor: 'rgba(168, 85, 247, 0.1)' }; // Purple
  }
  // PO (Petty Officer) & JPO (Jr. Petty Officer) - Blue
  if (rankLower.includes('petty') || rankLower.includes('jr.')) {
    return { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' }; // Blue
  }
  // Able Seaman & Seaman - Green
  if (rankLower.includes('able') || rankLower.includes('seaman')) {
    return { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' }; // Green
  }
  // Sailor - Blue
  if (rankLower.includes('sailor')) {
    return { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' }; // Blue
  }
  
  return { color: '#999999', bgColor: 'rgba(153, 153, 153, 0.1)' };
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
  console.log('All rows:', data.gullinbursti.rows);

  // Parse sailor data with proper column mapping
  // First pass: identify squad headers and assign squads to crew members
  const sailors: Array<{
    rank: string;
    name: string;
    squad: string;
    discordNickname: string;
    compliance: string;
    timezone: string;
    stars: string;
  }> = [];

  let currentSquad = 'Command Staff';
  
  for (let i = 0; i < data.gullinbursti.rows.length; i++) {
    const row = data.gullinbursti.rows[i];
    const rankVal = (row[data.gullinbursti.headers[0]] || '').trim();
    const nameVal = (row[data.gullinbursti.headers[1]] || '').trim();
    
    console.log(`Row ${i}: rank="${rankVal}", name="${nameVal}"`);
    
    // Skip completely empty rows
    if (rankVal === '' && nameVal === '') {
      console.log(`  -> Skipping empty row`);
      continue;
    }
    
    // Skip column header rows (where the row contains "Rank" and "Name" as values)
    if ((rankVal === 'Rank' || rankVal.toLowerCase() === 'rank') && 
        (nameVal === 'Name' || nameVal.toLowerCase() === 'name')) {
      console.log(`  -> Skipping column header row`);
      continue;
    }
    
    // Update squad if this is a header row (rank with value but name is empty)
    if (rankVal && nameVal === '') {
      console.log(`  -> Squad header detected: ${rankVal}`);
      currentSquad = rankVal;
      continue; // Don't include header rows
    }
    
    // Include actual crew rows (have rank and name)
    if (rankVal && nameVal) {
      console.log(`  -> Crew member: ${rankVal} ${nameVal} -> squad: ${currentSquad}`);
      const discordRaw = row[data.gullinbursti.headers[2]] || '';
      const loaStatusRaw = row[data.gullinbursti.headers[8]] || '';
      const timezoneRaw = row[data.gullinbursti.headers[7]] || '';
      const chatActivityRaw = row[data.gullinbursti.headers[10]] || '';

      sailors.push({
        rank: rankVal,
        name: nameVal,
        squad: currentSquad,
        discordNickname: discordRaw.trim(),
        compliance: loaStatusRaw.trim() || 'Unknown',
        timezone: timezoneRaw.trim() || '-',
        stars: chatActivityRaw.trim() || '0',
      });
    }
  }
  
  console.log('Parsed sailors:', sailors);

  const complianceStats = {
    total: sailors.length,
    compliant: sailors.filter(s => 
      s.compliance.toLowerCase().includes('active') ||
      s.compliance.toLowerCase().includes('duty') ||
      s.compliance === 'Within regulations'
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
                <TableCell sx={{ width: '12%' }}>Rank</TableCell>
                <TableCell sx={{ width: '20%' }}>Name</TableCell>
                <TableCell sx={{ width: '18%' }}>Squad</TableCell>
                <TableCell sx={{ width: '15%', textAlign: 'center' }}>Compliance</TableCell>
                <TableCell sx={{ width: '18%' }}>Timezone</TableCell>
                <TableCell sx={{ width: '17%', textAlign: 'center' }}>Activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sailors.map((sailor, idx) => {
                const complianceStatus = getComplianceStatus(sailor.compliance);
                const rankColor = getRankColor(sailor.rank);
                
                // Parse star count from chat activity field
                // It might be "★★★★★" or a number or text
                let starCount = 0;
                const starString = sailor.stars.toLowerCase();
                if (starString.includes('★')) {
                  starCount = (sailor.stars.match(/★/g) || []).length;
                } else {
                  // Try to parse as number
                  const parsed = parseInt(sailor.stars);
                  starCount = isNaN(parsed) ? 0 : parsed;
                }
                starCount = Math.min(5, Math.max(0, starCount));
                
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
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <Typography 
                        sx={{ 
                          color: rankColor.color,
                          fontWeight: 'bold',
                          fontSize: '0.95rem'
                        }}
                      >
                        {sailor.rank}
                      </Typography>
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
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: 
                              complianceStatus.status === 'compliant' ? 'rgba(34, 197, 94, 0.2)' :
                              complianceStatus.status === 'action-required' ? 'rgba(239, 68, 68, 0.2)' :
                              complianceStatus.status === 'attention-required' ? 'rgba(234, 179, 8, 0.2)' :
                              'rgba(107, 114, 128, 0.2)',
                            color:
                              complianceStatus.status === 'compliant' ? '#22c55e' :
                              complianceStatus.status === 'action-required' ? '#ef4444' :
                              complianceStatus.status === 'attention-required' ? '#eab308' :
                              '#6b7280',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {complianceStatus.icon}
                        </Box>
                      </Box>
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
