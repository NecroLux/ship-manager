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
import { parseAllCrewMembers, type ParsedCrewMember } from '../services/dataParser';

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
  const { data, loading, refreshData, error } = useSheetData();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography color="error" variant="body1" sx={{ mb: 2 }}>
          ❌ {error}
        </Typography>
        <Typography color="textSecondary" variant="body2" sx={{ mb: 2 }}>
          The backend service may not be running. Check:
        </Typography>
        <ul style={{ color: theme.palette.text.secondary }}>
          <li>Is the Render backend deployed and running?</li>
          <li>Open browser DevTools (F12) → Console tab for detailed errors</li>
          <li>Try clicking the Refresh button below</li>
        </ul>
        <Button 
          variant="contained" 
          onClick={() => refreshData()}
          sx={{ mt: 2 }}
        >
          Retry Loading Data
        </Button>
      </Box>
    );
  }

  // Check data exists
  if (!data.gullinbursti || !data.gullinbursti.rows || data.gullinbursti.rows.length === 0) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography color="textSecondary">No crew data available</Typography>
      </Box>
    );
  }

  // Debug logs removed for production

  // Parse crew members using centralized data parser
  const crew = parseAllCrewMembers(data.gullinbursti.rows);

  // Transform parsed crew into display format
  const sailors = crew.map((member: ParsedCrewMember) => {
    // Determine compliance: check if voyage/host requirements are met
    // sailingCompliant and hostingCompliant are already booleans from the sheet
    // If LOA, show LOA status; otherwise show compliance result
    let complianceDisplay: string;
    if (member.loaStatus && member.complianceStatus) {
      // If on LOA, show the LOA status
      complianceDisplay = member.complianceStatus;
    } else {
      // Check voyage/host requirements met
      complianceDisplay = (member.sailingCompliant && member.hostingCompliant) ? 'Compliant' : 'Requires Attention';
    }

    return {
      rank: member.rank,
      name: member.name,
      squad: member.squad,
      discordNickname: member.discordUsername,
      compliance: complianceDisplay,
      timezone: member.timezone,
      stars: member.chatActivity.toString(),
      loaReturnDate: member.loaReturnDate,
      loaStatus: member.loaStatus,
    };
  });

  const complianceStats = {
    total: sailors.length,
    compliant: sailors.filter(s => 
      !s.loaStatus && s.compliance === 'Compliant'
    ).length,
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Refresh Button and Stats */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
          {sailors.length > 0 && (
            <>
              <Card sx={{ flex: 1, minWidth: 100 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Total Crew
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
                    {sailors.length}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 100 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    In Compliance
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                    {complianceStats.compliant}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 100 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Flagged
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ef4444' }}>
                    {sailors.length - complianceStats.compliant}
                  </Typography>
                </CardContent>
              </Card>
            </>
          )}
        </Box>
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
    </Box>
  );
};
