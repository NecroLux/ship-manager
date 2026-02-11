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
import { parseAllCrewMembers, parseAllLeaderboardEntries, enrichCrewWithLeaderboardData, type ParsedCrewMember } from '../services/dataParser';

// Helper function to get compliance status
// PRIORITY ORDER (Gullinbursti is source of truth):
//   1. LOA → always compliant (exempt)
//   2. Gullinbursti sailingCompliant = TRUE → compliant (FO maintains this field)
//   3. Gullinbursti sailingCompliant = FALSE → use leaderboard thresholds for severity:
//      - Voyage:  Action >=30d | Attention >=28d | else Attention (default)
//      - Hosting (JPO+): Action >=14d | Attention >=12d
const getComplianceStatus = (member: any) => {
  // If on LOA, they are exempt from sailing/hosting requirements
  if (member.loaStatus) {
    return { label: 'Compliant', color: 'success' as const, icon: '✓', status: 'compliant' };
  }

  // Gullinbursti's sailingCompliant is the source of truth (maintained by FO)
  // If it says compliant, they ARE compliant — regardless of leaderboard data
  if (member.sailingCompliant) {
    return { label: 'Compliant', color: 'success' as const, icon: '✓', status: 'compliant' };
  }

  // === Not compliant per Gullinbursti — determine Attention vs Action ===
  const now = new Date();
  let requiresAction = false;

  // Check voyage threshold
  if (member.lastVoyageDate) {
    const lastVoyage = new Date(member.lastVoyageDate);
    if (!isNaN(lastVoyage.getTime())) {
      const daysSinceVoyage = Math.floor((now.getTime() - lastVoyage.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceVoyage >= 30) requiresAction = true;
    }
  } else if (member.daysInactive >= 30) {
    requiresAction = true;
  }

  // Check hosting threshold (only for JPO+ who are eligible to host)
  if (member.canHostRank && member.lastHostDate) {
    const lastHost = new Date(member.lastHostDate);
    if (!isNaN(lastHost.getTime())) {
      const daysSinceHost = Math.floor((now.getTime() - lastHost.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceHost >= 14) requiresAction = true;
    }
  }

  if (requiresAction) {
    return { label: 'Requires Action', color: 'error' as const, icon: '!', status: 'action-required' };
  }

  // Default for non-compliant: Requires Attention
  return { label: 'Requires Attention', color: 'warning' as const, icon: '~', status: 'attention-required' };
};

// Helper function to get status label and color
// Status = their LOA/active status (separate from compliance)
const getStatusDisplay = (member: any) => {
  const loaRaw = (member.complianceStatus || '').trim();
  const normalized = loaRaw.toLowerCase();
  
  // Active status
  if (normalized.includes('active') || normalized.includes('duty') || normalized === '' || normalized === 'unknown') {
    return { label: 'Active', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' };
  }
  
  // LOA statuses - return as-is with uppercasing
  if (normalized.includes('loa')) {
    const uppercased = loaRaw.toUpperCase().trim();
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

  // Parse leaderboard data from Voyage Awards sheet for voyage/host counts
  const leaderboardData = data.voyageAwards?.rows ? parseAllLeaderboardEntries(data.voyageAwards.rows) : [];

  // Transform parsed crew into display format, enriched with voyage/host counts
  const sailors = crew.map((member: ParsedCrewMember) => {
    const enriched = enrichCrewWithLeaderboardData(member, leaderboardData);
    return {
      rank: member.rank,
      name: member.name,
      squad: member.squad,
      discordNickname: member.discordUsername,
      complianceStatus: member.complianceStatus || 'Unknown', // LOA status column (Active Duty, LOA-1, etc.)
      sailingCompliant: member.sailingCompliant, // Have they sailed this month?
      loaStatus: member.loaStatus, // Are they on LOA?
      timezone: member.timezone,
      stars: member.chatActivity.toString(),
      chatActivity: member.chatActivity,
      loaReturnDate: member.loaReturnDate,
      voyageCount: enriched.voyageCount,
      hostCount: enriched.hostCount,
      daysInactive: enriched.daysInactive,
      lastVoyageDate: enriched.lastVoyageDate,
      lastHostDate: enriched.lastHostDate,
      canHostRank: member.canHostRank, // JPO+ can host
    };
  });

  const complianceStats = {
    total: sailors.length,
    compliant: sailors.filter(s => getComplianceStatus(s).status === 'compliant').length,
    attention: sailors.filter(s => getComplianceStatus(s).status === 'attention-required').length,
    action: sailors.filter(s => getComplianceStatus(s).status === 'action-required').length,
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Refresh Button and Stats */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
          {sailors.length > 0 && (
            <>
              <Card sx={{ flex: 1, minWidth: 80 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Total Crew
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
                    {sailors.length}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 80 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Compliant
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#22c55e' }}>
                    {complianceStats.compliant}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 80 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Attention
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#eab308' }}>
                    {complianceStats.attention}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 80 }}>
                <CardContent sx={{ textAlign: 'center', py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                  <Typography color="textSecondary" variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Action
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ef4444' }}>
                    {complianceStats.action}
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
                          <TableCell colSpan={8} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem', color: '#FFFFFF', backgroundColor: 'transparent' }}>
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
                          <TableCell sx={{ width: '15%' }}>Rank</TableCell>
                          <TableCell sx={{ width: '17%' }}>Name</TableCell>
                          <TableCell sx={{ width: '10%', textAlign: 'center' }}>Status</TableCell>
                          <TableCell sx={{ width: '8%', textAlign: 'center' }}>Sailing</TableCell>
                          <TableCell sx={{ width: '8%', textAlign: 'center' }}>Voyages</TableCell>
                          <TableCell sx={{ width: '8%', textAlign: 'center' }}>Hosted</TableCell>
                          <TableCell sx={{ width: '14%' }}>Timezone</TableCell>
                          <TableCell sx={{ width: '12%', textAlign: 'center' }}>Activity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {members.map((sailor, idx) => {
                          const complianceStatus = getComplianceStatus(sailor);
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
                              <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                                {(() => {
                                  const statusDisplay = getStatusDisplay(sailor);
                                  return (
                                    <Box
                                      sx={{
                                        display: 'inline-block',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        backgroundColor: statusDisplay.bgColor,
                                        color: statusDisplay.color,
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
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

                              {/* Voyages */}
                              <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: sailor.voyageCount > 0 ? '#FFFFFF' : '#6b7280',
                                  }}
                                >
                                  {sailor.voyageCount}
                                </Typography>
                              </TableCell>

                              {/* Hosted */}
                              <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: sailor.hostCount > 0 ? '#FFFFFF' : '#6b7280',
                                  }}
                                >
                                  {sailor.hostCount}
                                </Typography>
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
