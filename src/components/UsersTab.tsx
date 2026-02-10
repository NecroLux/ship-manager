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

// Helper function to get status label and color
const getStatusDisplay = (complianceValue: string) => {
  if (!complianceValue) return { label: 'Unknown', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
  const normalized = complianceValue.toLowerCase().trim();
  
  // Active status
  if (normalized.includes('active') || normalized.includes('duty') || 
      normalized === 'within regulations' || normalized === 'yes' || normalized === 'compliant') {
    return { label: 'Active', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' };
  }
  
  // LOA statuses - return as-is with uppercasing
  if (normalized.includes('loa')) {
    const uppercased = complianceValue.toUpperCase().trim();
    return { label: uppercased, color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)' };
  }
  
  // Flagged/Non-compliant
  if (normalized === 'flagged' || normalized === 'no' || normalized === 'non-compliant' || normalized === 'requires action') {
    return { label: 'Flagged', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
  }
  
  return { label: normalized.charAt(0).toUpperCase() + normalized.slice(1), color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
};

// Helper function to get rank color and styling
const getRankColor = (rank: string) => {
  if (!rank) return { color: '#B3B3B3', bgColor: 'rgba(179, 179, 179, 0.1)' };
  const rankLower = rank.toLowerCase();
  
  // Lt. Commander - Bright Red
  if (rankLower.includes('commander') && !rankLower.includes('petty')) {
    return { color: '#FF5555', bgColor: 'rgba(255, 85, 85, 0.1)' }; // Bright Red
  }
  // Midshipwoman - Bright Pink
  if (rankLower.includes('midship')) {
    return { color: '#FF66B2', bgColor: 'rgba(255, 102, 178, 0.1)' }; // Bright Pink
  }
  // SCPO - Bright Purple
  if (rankLower.includes('scpo') || (rankLower.includes('senior') && rankLower.includes('petty'))) {
    return { color: '#D946EF', bgColor: 'rgba(217, 70, 239, 0.1)' }; // Bright Purple
  }
  // PO (Petty Officer) & JPO (Jr. Petty Officer) - Bright Blue
  if (rankLower.includes('petty') || rankLower.includes('jr.')) {
    return { color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.1)' }; // Bright Blue
  }
  // Able Seaman & Seaman - Bright Green
  if (rankLower.includes('able') || rankLower.includes('seaman')) {
    return { color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.1)' }; // Bright Green
  }
  // Sailor - Bright Blue
  if (rankLower.includes('sailor')) {
    return { color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.1)' }; // Bright Blue
  }
  
  return { color: '#B3B3B3', bgColor: 'rgba(179, 179, 179, 0.1)' };
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(() => {
            // Group sailors by squad
            const squadGroups: Record<string, typeof sailors> = {};
            sailors.forEach(sailor => {
              if (!squadGroups[sailor.squad]) {
                squadGroups[sailor.squad] = [];
              }
              squadGroups[sailor.squad].push(sailor);
            });

            // Define squad colors
            const squadColors: Record<string, { border: string; bg: string; light: string }> = {
              'Command Staff': { border: '#FCD34D', bg: 'rgba(252, 211, 77, 0.1)', light: 'rgba(252, 211, 77, 0.05)' }, // Gold
              'Necro Squad': { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', light: 'rgba(59, 130, 246, 0.05)' }, // Blue
              'Shade Squad': { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', light: 'rgba(16, 185, 129, 0.05)' }, // Green
            };

            return Object.entries(squadGroups).map(([squad, members]) => {
              const squadColor = squadColors[squad] || { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', light: 'rgba(107, 114, 128, 0.05)' };
              
              return (
                <Box
                  key={`squad-box-${squad}`}
                  sx={{
                    borderLeft: `4px solid ${squadColor.border}`,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  <TableContainer 
                    component={Paper}
                    sx={{ 
                      borderRadius: 0,
                      overflow: 'hidden',
                      boxShadow: 'none',
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow 
                          sx={{
                            backgroundColor: 'transparent',
                            '& th': {
                              backgroundColor: 'transparent',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: '#FFFFFF',
                              borderBottom: `2px solid ${squadColor.border}`,
                              py: 1.5,
                            }
                          }}
                        >
                          <TableCell colSpan={6} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem', color: '#FFFFFF', backgroundColor: 'transparent' }}>
                            {squad}
                          </TableCell>
                        </TableRow>
                        <TableRow 
                          sx={{ 
                            backgroundColor: 'transparent',
                            '& th': {
                              backgroundColor: 'transparent',
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              borderBottom: `2px solid ${theme.palette.divider}`,
                            }
                          }}
                        >
                          <TableCell sx={{ width: '12%' }}>Rank</TableCell>
                          <TableCell sx={{ width: '18%' }}>Name</TableCell>
                          <TableCell sx={{ width: '13%' }}>Status</TableCell>
                          <TableCell sx={{ width: '13%', textAlign: 'center' }}>Compliance</TableCell>
                          <TableCell sx={{ width: '16%' }}>Timezone</TableCell>
                          <TableCell sx={{ width: '15%', textAlign: 'center' }}>Activity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {members.map((sailor, idx) => {
                          const complianceStatus = getComplianceStatus(sailor.compliance);
                          const rankColor = getRankColor(sailor.rank);
                          
                          // Parse star count from chat activity field
                          let starCount = 0;
                          const starString = sailor.stars.toLowerCase();
                          if (starString.includes('★')) {
                            starCount = (sailor.stars.match(/★/g) || []).length;
                          } else {
                            const parsed = parseInt(sailor.stars);
                            starCount = isNaN(parsed) ? 0 : parsed;
                          }
                          starCount = Math.min(5, Math.max(0, starCount));
                          
                          return (
                            <TableRow
                              key={`sailor-${squad}-${idx}`}
                              hover
                              sx={{
                                backgroundColor: 'transparent',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                },
                                borderBottom: `1px solid ${theme.palette.divider}`,
                              }}
                            >
                              {/* Rank */}
                              <TableCell sx={{ fontWeight: 'bold', py: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Typography 
                                  sx={{ 
                                    color: rankColor.color,
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {sailor.rank}
                                </Typography>
                              </TableCell>

                              {/* Name */}
                              <TableCell sx={{ fontWeight: 500, py: 1.5 }}>
                                {sailor.name}
                              </TableCell>

                              {/* Status */}
                              <TableCell sx={{ py: 1.5 }}>
                                {(() => {
                                  const statusDisplay = getStatusDisplay(sailor.compliance);
                                  return (
                                    <Box
                                      sx={{
                                        display: 'inline-block',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 1,
                                        backgroundColor: statusDisplay.bgColor,
                                        color: statusDisplay.color,
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {statusDisplay.label}
                                    </Box>
                                  );
                                })()}
                              </TableCell>

                              {/* Compliance */}
                              <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
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
                              <TableCell sx={{ fontSize: '0.9rem', py: 1.5 }}>
                                {sailor.timezone !== '-' ? `${sailor.timezone}` : '-'}
                              </TableCell>

                              {/* Activity Stars */}
                              <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
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
                </Box>
              );
            });
          })()}
        </Box>
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
