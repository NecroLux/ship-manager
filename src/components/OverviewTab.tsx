import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  LinearProgress,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useSheetData } from '../context/SheetDataContext';

interface SquadStatsDetailed {
  name: string;
  totalCount: number;
  activeCount: number;
  loa1Count: number;
  loa2Count: number;
  flaggedCount: number;
  members: Array<{ name: string; rank: string; compliance: string }>;
}

interface TopVoyager {
  name: string;
  rank: string;
  hosted: number;
  voyages: number;
}

export const OverviewTab = () => {
  const { data, loading, refreshData } = useSheetData();
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Comprehensive crew analysis
  const analyzeCrewData = () => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) {
      return {
        totalCrew: 0,
        activeCrew: 0,
        loaCrew: 0,
        flaggedCrew: 0,
        compliancePercentage: 0,
        squadStats: [] as SquadStatsDetailed[],
        commandStaffMembers: [] as Array<{ name: string; rank: string }>,
      };
    }

    const gullinRows = data.gullinbursti.rows;
    const headers = data.gullinbursti.headers;
    
    let totalCrew = 0;
    let activeCrew = 0;
    let loaCrew = 0;
    let flaggedCrew = 0;
    
    const squadMap: Record<string, SquadStatsDetailed> = {};
    const commandStaffMembers: Array<{ name: string; rank: string }> = [];
    let currentSquad = '';

    gullinRows.forEach((row) => {
      const rank = (row[headers[0]] || '').trim();
      const name = (row[headers[1]] || '').trim();
      
      // Skip header rows
      if ((rank === 'Rank' || rank.toLowerCase() === 'rank') && 
          (name === 'Name' || name.toLowerCase() === 'name')) {
        return;
      }

      // Skip completely empty rows
      if (!rank && !name) return;

      // Check if this is a squad header row (rank has value but name is empty)
      if (rank && !name) {
        currentSquad = rank;
        return;
      }

      // Skip rows without both rank and name
      if (!rank || !name) return;

      totalCrew++;

      // Get compliance status - use same index as ReportsTab (headers[8])
      const compliance = (row[headers[8]] || '').trim();

      // Categorize compliance - check exact compliance value from Gullinbursti
      const complianceNorm = compliance.toLowerCase();
      let isActive = false;
      let isFlagged = false;
      
      // Active status: contains "active" or "duty"
      if (complianceNorm.includes('active') || complianceNorm.includes('duty') || complianceNorm === '') {
        isActive = true;
        activeCrew++;
      } 
      // LOA statuses: LOA-1 specifically
      else if (complianceNorm === 'loa-1') {
        loaCrew++;
      } 
      // LOA-2 and other issues
      else if (complianceNorm === 'loa-2' || complianceNorm === 'flagged' || complianceNorm === 'no' || complianceNorm === 'non-compliant' || complianceNorm === 'inactive' || complianceNorm === 'requires action') {
        isFlagged = true;
        flaggedCrew++;
      }

      // Track squad stats
      if (!squadMap[currentSquad]) {
        squadMap[currentSquad] = {
          name: currentSquad,
          totalCount: 0,
          activeCount: 0,
          loa1Count: 0,
          loa2Count: 0,
          flaggedCount: 0,
          members: [],
        };
      }

      squadMap[currentSquad].totalCount++;
      squadMap[currentSquad].members.push({ name, rank, compliance });

      if (isActive) {
        squadMap[currentSquad].activeCount++;
      } else if (complianceNorm === 'loa-1') {
        squadMap[currentSquad].loa1Count++;
      } else if (complianceNorm === 'loa-2') {
        squadMap[currentSquad].loa2Count++;
      } else if (isFlagged) {
        squadMap[currentSquad].flaggedCount++;
      }

      // Track Command Staff members for split display
      if (currentSquad.trim().toLowerCase() === 'command staff') {
        commandStaffMembers.push({ name, rank });
      }
    });

    const squadStats = Object.values(squadMap);
    const compliancePercentage = totalCrew > 0 ? Math.round((activeCrew / totalCrew) * 100) : 0;

    return {
      totalCrew,
      activeCrew,
      loaCrew,
      flaggedCrew,
      compliancePercentage,
      squadStats,
      commandStaffMembers,
    };
  };

  // Get actions count from the same logic as ActionsTab
  const getActionsCount = () => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return 0;

    let actionCount = 0;
    const headers = data.gullinbursti.headers;

    data.gullinbursti.rows.forEach((row) => {
      const rank = (row[headers[0]] || '').trim();
      const name = (row[headers[1]] || '').trim();
      
      if ((rank === 'Rank' || rank.toLowerCase() === 'rank') && 
          (name === 'Name' || name.toLowerCase() === 'name')) {
        return;
      }

      if (!rank && !name) return;

      if (rank && !name) {
        return;
      }

      if (!rank || !name) return;

      // Get compliance status
      let compliance = '';
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().includes('compliance')) {
          compliance = (row[headers[i]] || '').trim();
          break;
        }
      }

      // Get stars
      let starsRaw = '';
      for (let i = 0; i < headers.length; i++) {
        const headerLower = headers[i].toLowerCase();
        if (headerLower.includes('chat') || headerLower.includes('star') || headerLower.includes('activity')) {
          starsRaw = (row[headers[i]] || '').trim();
          break;
        }
      }
      const stars = (starsRaw.match(/[★*]/g) || []).length;

      // Count actions
      const complianceLower = compliance.toLowerCase().trim();
      const isOnLeave = complianceLower.includes('loa') || 
                        complianceLower.includes('leave') || 
                        complianceLower.includes('off-duty');
      
      // No chat activity action
      if (stars === 0 && !isOnLeave) {
        actionCount++;
      }

      // Compliance issue action
      const shouldFlag = 
        complianceLower === 'inactive' || 
        complianceLower === 'flagged' || 
        complianceLower === 'no' ||
        complianceLower === 'non-compliant' ||
        complianceLower === 'requires action';
      
      if (shouldFlag) {
        actionCount++;
      }
    });

    return actionCount;
  };

  // Get top hosts and voyagers from voyage awards sheet
  const getTopVoyagers = (): TopVoyager[] => {
    if (!data.voyageAwards || !data.gullinbursti) {
      return [];
    }

    const voyageRows = data.voyageAwards.rows;
    const crewNames = new Set<string>();
    const crewRanks: Record<string, string> = {};

    // Build crew name and rank map
    data.gullinbursti.rows.forEach((row) => {
      const rank = (row[data.gullinbursti.headers[0]] || '').trim();
      const name = (row[data.gullinbursti.headers[1]] || '').trim();

      if ((rank === 'Rank' || rank.toLowerCase() === 'rank') && 
          (name === 'Name' || name.toLowerCase() === 'name')) {
        return;
      }

      if (!rank && !name) return;

      if (rank && !name) {
        return;
      }

      if (!rank || !name) return;

      crewNames.add(name);
      crewRanks[name] = rank;
    });

    const voyagerMap: Record<string, { hosted: number; voyages: number }> = {};

    voyageRows.forEach((row) => {
      let matchedName = '';
      let hostCount = 0;
      let voyageCount = 0;

      // Find the name in this row
      Object.entries(row).forEach(([key, value]) => {
        const valueStr = (value || '').trim();
        
        if (!matchedName && crewNames.has(valueStr)) {
          matchedName = valueStr;
        }

        const keyLower = key.toLowerCase();
        if (keyLower.includes('host') && !isNaN(Number(value))) {
          hostCount = Math.max(hostCount, parseInt(value as string, 10) || 0);
        }
        
        if (keyLower.includes('voyage') && !isNaN(Number(value))) {
          voyageCount = Math.max(voyageCount, parseInt(value as string, 10) || 0);
        }
      });

      if (matchedName && (hostCount > 0 || voyageCount > 0)) {
        if (!voyagerMap[matchedName]) {
          voyagerMap[matchedName] = { hosted: 0, voyages: 0 };
        }
        voyagerMap[matchedName].hosted = Math.max(voyagerMap[matchedName].hosted, hostCount);
        voyagerMap[matchedName].voyages = Math.max(voyagerMap[matchedName].voyages, voyageCount);
      }
    });

    return Object.entries(voyagerMap)
      .map(([name, stats]) => ({
        name,
        rank: crewRanks[name] || 'Unknown',
        hosted: stats.hosted,
        voyages: stats.voyages,
      }))
      .sort((a, b) => (b.hosted + b.voyages) - (a.hosted + a.voyages))
      .slice(0, 5);
  };

  // Separate top hosts and voyagers
  const getTopHosts = (): TopVoyager[] => {
    return getTopVoyagers()
      .sort((a, b) => b.hosted - a.hosted)
      .slice(0, 5);
  };

  const getTopVoyages = (): TopVoyager[] => {
    return getTopVoyagers()
      .sort((a, b) => b.voyages - a.voyages)
      .slice(0, 5);
  };

  const crewAnalysis = analyzeCrewData();
  const actionsCount = getActionsCount();
  const topHosts = getTopHosts();
  const topVoyages = getTopVoyages();

  // Get compliance color based on percentage
  const getComplianceColor = (percentage: number) => {
    if (percentage > 75) return '#22c55e'; // Green
    if (percentage >= 50) return '#eab308'; // Yellow
    if (percentage >= 25) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const complianceColor = getComplianceColor(crewAnalysis.compliancePercentage);

  return (
    <Box sx={{ mt: 3 }}>
      {/* Key Metrics Cards */}
      <Stack direction={{ xs: 'column', sm: 'row', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon sx={{ color: 'success.main' }} />
                <Typography color="textSecondary" variant="body2">
                  Total Crew
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {crewAnalysis.totalCrew}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)' }}>
          <CardContent>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: complianceColor }} />
                <Typography color="textSecondary" variant="body2">
                  Compliance Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: complianceColor }}>
                {crewAnalysis.compliancePercentage}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={crewAnalysis.compliancePercentage}
                sx={{ 
                  height: 6, 
                  borderRadius: 1, 
                  backgroundColor: 'action.disabledBackground',
                  '& .MuiLinearProgress-bar': { backgroundColor: complianceColor }
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
          <CardContent>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TaskAltIcon sx={{ color: '#3b82f6' }} />
                <Typography color="textSecondary" variant="body2">
                  Actions Required
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
                {actionsCount}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Compliance Breakdown and Squad Status */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Compliance Status Breakdown
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={refreshData}
                >
                  Refresh
                </Button>
              </Box>
              
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Active / Compliant</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {crewAnalysis.activeCrew}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.activeCrew / crewAnalysis.totalCrew) * 100 : 0}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Requires Attention</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {crewAnalysis.loaCrew}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.loaCrew / crewAnalysis.totalCrew) * 100 : 0}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'warning.main' } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Requires Action</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {crewAnalysis.flaggedCrew}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.flaggedCrew / crewAnalysis.totalCrew) * 100 : 0}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'error.main' } }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Squad Distribution
              </Typography>
              <Stack spacing={2}>
                {crewAnalysis.squadStats.length === 0 ? (
                  <Typography color="textSecondary">No squad data available</Typography>
                ) : (
                  crewAnalysis.squadStats.map((squad) => {
                    const activePercent = squad.totalCount > 0 ? (squad.activeCount / squad.totalCount) * 100 : 0;
                    const loa1Percent = squad.totalCount > 0 ? (squad.loa1Count / squad.totalCount) * 100 : 0;
                    const loa2Percent = squad.totalCount > 0 ? (squad.loa2Count / squad.totalCount) * 100 : 0;
                    
                    if (squad.name === 'Command Staff') {
                      // Create a split bar for Command Staff: CO (Red), FO (Pink), COS (Purple)
                      let coCount = 0;
                      let foCount = 0;
                      let cosCount = 0;
                      
                      squad.members.forEach((member) => {
                        if (member.name.toLowerCase().includes('hoit') && !member.name.toLowerCase().includes('lady')) {
                          coCount++;
                        } else if (member.name.toLowerCase().includes('ladyhoit')) {
                          foCount++;
                        } else if (member.name.toLowerCase().includes('spice')) {
                          cosCount++;
                        }
                      });

                      const coPercent = squad.totalCount > 0 ? (coCount / squad.totalCount) * 100 : 0;
                      const foPercent = squad.totalCount > 0 ? (foCount / squad.totalCount) * 100 : 0;
                      const cosPercent = squad.totalCount > 0 ? (cosCount / squad.totalCount) * 100 : 0;

                      return (
                        <Box key={squad.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Command Staff
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {squad.totalCount}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', backgroundColor: 'action.disabledBackground' }}>
                            {coPercent > 0 && (
                              <Box 
                                sx={{ width: `${coPercent}%`, backgroundColor: '#FF5555' }} 
                                title={`CO (Hoit): ${coCount}`} 
                              />
                            )}
                            {foPercent > 0 && (
                              <Box 
                                sx={{ width: `${foPercent}%`, backgroundColor: '#FF66B2' }} 
                                title={`FO (LadyHoit): ${foCount}`} 
                              />
                            )}
                            {cosPercent > 0 && (
                              <Box 
                                sx={{ width: `${cosPercent}%`, backgroundColor: '#D946EF' }} 
                                title={`COS (Spice): ${cosCount}`} 
                              />
                            )}
                          </Box>
                        </Box>
                      );
                    }

                    const flaggedPercent = squad.totalCount > 0 ? (squad.flaggedCount / squad.totalCount) * 100 : 0;

                    return (
                      <Box key={squad.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {squad.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {squad.totalCount}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', backgroundColor: 'action.disabledBackground' }}>
                          {activePercent > 0 && (
                            <Box sx={{ width: `${activePercent}%`, backgroundColor: '#22c55e' }} title={`Active: ${squad.activeCount}`} />
                          )}
                          {loa1Percent > 0 && (
                            <Box sx={{ width: `${loa1Percent}%`, backgroundColor: '#eab308' }} title={`LOA-1: ${squad.loa1Count}`} />
                          )}
                          {loa2Percent > 0 && (
                            <Box sx={{ width: `${loa2Percent}%`, backgroundColor: '#f97316' }} title={`LOA-2: ${squad.loa2Count}`} />
                          )}
                          {flaggedPercent > 0 && (
                            <Box sx={{ width: `${flaggedPercent}%`, backgroundColor: '#ef4444' }} title={`Non-Compliant: ${squad.flaggedCount}`} />
                          )}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Top Hosted and Top Voyages */}
      {(topHosts.length > 0 || topVoyages.length > 0) && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
          {/* Top Hosts */}
          {topHosts.length > 0 && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon color="success" />
                  Top Hosts 🏠
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topHosts.map((sailor, idx) => (
                        <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{sailor.name}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={sailor.hosted}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Voyagers */}
          {topVoyages.length > 0 && (
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon color="success" />
                  Top Voyagers ⛵
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topVoyages.map((sailor, idx) => (
                        <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{sailor.name}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={sailor.voyages}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </Box>
  );
};
