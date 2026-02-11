import {
  Box,
  Paper,
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
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useSheetData } from '../context/SheetDataContext';

interface ActionItem {
  sailor: string;
  actionType: 'attention' | 'promotion' | 'activity' | 'award';
  details: string;
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceStats {
  compliant: number;
  attention: number;
  action: number;
  unknown: number;
}

interface SquadStats {
  name: string;
  count: number;
  compliance: number;
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

  // Analyze crew data comprehensively
  const analyzeCrewData = () => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) {
      return {
        totalCrew: 0,
        complianceStats: { compliant: 0, attention: 0, action: 0, unknown: 0 },
        squadStats: [],
        topPerformers: [],
        actionItems: [],
        compliancePercentage: 0,
      };
    }

    const gullinRows = data.gullinbursti.rows;
    const headers = data.gullinbursti.headers;
    const complianceStats: ComplianceStats = { compliant: 0, attention: 0, action: 0, unknown: 0 };
    const squadMap: Record<string, { count: number; compliance: number }> = {};
    const topPerformers: Array<{ name: string; stars: number; squad: string }> = [];
    const actionItems: ActionItem[] = [];
    
    let currentSquad = 'Command Staff';
    let totalCrew = 0;

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

      // Get compliance status
      let compliance = '';
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().includes('compliance')) {
          compliance = (row[headers[i]] || '').trim();
          break;
        }
      }

      // Categorize compliance
      const complianceNorm = compliance.toLowerCase();
      if (complianceNorm.includes('active') || complianceNorm.includes('duty') || complianceNorm === 'yes') {
        complianceStats.compliant++;
      } else if (complianceNorm.includes('loa') || complianceNorm.includes('warning')) {
        complianceStats.attention++;
      } else if (complianceNorm === 'flagged' || complianceNorm === 'no' || complianceNorm === 'non-compliant') {
        complianceStats.action++;
      } else {
        complianceStats.unknown++;
      }

      // Track squad stats
      if (!squadMap[currentSquad]) {
        squadMap[currentSquad] = { count: 0, compliance: 0 };
      }
      squadMap[currentSquad].count++;
      if (complianceStats.compliant > 0) {
        squadMap[currentSquad].compliance++;
      }

      // Extract stars
      let starsRaw = '';
      for (let i = 0; i < headers.length; i++) {
        const headerLower = headers[i].toLowerCase();
        if (headerLower.includes('chat') || headerLower.includes('star') || headerLower.includes('activity')) {
          starsRaw = (row[headers[i]] || '').trim();
          break;
        }
      }
      const starCount = (starsRaw.match(/★/g) || []).length;
      if (starCount > 0) {
        topPerformers.push({ name, stars: starCount, squad: currentSquad });
      }

      // Flag sailors with issues
      if (complianceStats.action > 0 && complianceNorm === 'flagged') {
        actionItems.push({
          sailor: name,
          actionType: 'attention',
          details: `Compliance Status: ${compliance}`,
          priority: 'high',
        });
      }
    });

    const squadStats: SquadStats[] = Object.entries(squadMap).map(([name, stats]) => ({
      name,
      count: stats.count,
      compliance: stats.compliance,
    }));

    topPerformers.sort((a, b) => b.stars - a.stars);

    return {
      totalCrew,
      complianceStats,
      squadStats,
      topPerformers: topPerformers.slice(0, 5),
      actionItems: actionItems.slice(0, 10),
      compliancePercentage: totalCrew > 0 ? Math.round((complianceStats.compliant / totalCrew) * 100) : 0,
    };
  };

  // Analyze voyage awards data
  const analyzeAwards = () => {
    if (!data.voyageAwards || data.voyageAwards.rows.length === 0) {
      return { totalAwards: 0, topAwardWinners: [] };
    }

    const rows = data.voyageAwards.rows;
    const awardMap: Record<string, number> = {};

    rows.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        const keyLower = key.toLowerCase();
        if ((keyLower.includes('award') || keyLower.includes('medal')) && value && value !== '-') {
          const name = row['Name'] || row['Sailor'] || '';
          if (name) {
            awardMap[name] = (awardMap[name] || 0) + 1;
          }
        }
      });
    });

    const topAwardWinners = Object.entries(awardMap)
      .map(([name, count]) => ({ name, awards: count }))
      .sort((a, b) => b.awards - a.awards)
      .slice(0, 5);

    return {
      totalAwards: Object.values(awardMap).reduce((a, b) => a + b, 0),
      topAwardWinners,
    };
  };

  const crewAnalysis = analyzeCrewData();
  const awardAnalysis = analyzeAwards();

  return (
    <Box sx={{ mt: 3 }}>
      {/* Key Metrics Cards */}
      <Stack direction={{ xs: 'column', sm: 'row', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)' }}>
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
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                <Typography color="textSecondary" variant="body2">
                  Compliance Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {crewAnalysis.compliancePercentage}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={crewAnalysis.compliancePercentage}
                sx={{ height: 6, borderRadius: 1, backgroundColor: 'action.disabledBackground' }}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)' }}>
          <CardContent>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon sx={{ color: 'error.main' }} />
                <Typography color="textSecondary" variant="body2">
                  Require Action
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {crewAnalysis.complianceStats.action}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.05)' }}>
          <CardContent>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: 'warning.main' }} />
                <Typography color="textSecondary" variant="body2">
                  Total Awards
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {awardAnalysis.totalAwards}
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
                      {crewAnalysis.complianceStats.compliant}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.complianceStats.compliant / crewAnalysis.totalCrew) * 100 : 0}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Requires Attention (LOA)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {crewAnalysis.complianceStats.attention}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.complianceStats.attention / crewAnalysis.totalCrew) * 100 : 0}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'warning.main' } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Requires Action (Flagged)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {crewAnalysis.complianceStats.action}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.complianceStats.action / crewAnalysis.totalCrew) * 100 : 0}
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
              <Stack spacing={1}>
                {crewAnalysis.squadStats.length === 0 ? (
                  <Typography color="textSecondary">No squad data available</Typography>
                ) : (
                  crewAnalysis.squadStats.map((squad) => (
                    <Box key={squad.name}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{squad.name}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {squad.count}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={crewAnalysis.totalCrew > 0 ? (squad.count / crewAnalysis.totalCrew) * 100 : 0}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Top Performers */}
      {crewAnalysis.topPerformers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon color="success" />
              Top Performers (Chat Activity)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Squad</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">⭐ Activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {crewAnalysis.topPerformers.map((sailor, idx) => (
                    <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{sailor.name}</TableCell>
                      <TableCell>{sailor.squad}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${sailor.stars} ${sailor.stars === 1 ? 'star' : 'stars'}`}
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

      {/* Top Award Winners */}
      {awardAnalysis.topAwardWinners.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EmojiEventsIcon sx={{ color: 'warning.main' }} />
              Top Award Recipients
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Awards</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {awardAnalysis.topAwardWinners.map((sailor, idx) => (
                    <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{sailor.name}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={sailor.awards}
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

      {/* Action Items */}
      {crewAnalysis.actionItems.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="error" />
              Immediate Action Required
            </Typography>
            <Stack spacing={1}>
              {crewAnalysis.actionItems.map((item, idx) => (
                <Paper key={idx} sx={{ p: 2, backgroundColor: 'error.light' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.sailor}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.details}
                      </Typography>
                    </Box>
                    <Chip 
                      label="HIGH" 
                      size="small" 
                      sx={{ backgroundColor: 'error.main', color: 'white' }} 
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
