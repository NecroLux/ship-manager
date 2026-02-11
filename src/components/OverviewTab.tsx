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
  Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useSheetData } from '../context/SheetDataContext';
import {
  parseAllCrewMembers,
  parseAllLeaderboardEntries,
  getTopHosts as getTopHostsFromParser,
  getTopVoyagers as getTopVoyagersFromParser,
} from '../services/dataParser';

interface SquadStats {
  name: string;
  totalCount: number;
  compliantCount: number;
  attentionCount: number;
  actionCount: number;
  members: Array<{
    name: string;
    rank: string;
    sailingCompliant: boolean;
    loaStatus: boolean;
  }>;
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

  const analyzeCrewData = () => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) {
      return {
        totalCrew: 0, compliantCrew: 0, attentionCrew: 0, actionCrew: 0,
        compliancePercentage: 0, squadStats: [] as SquadStats[],
        commandStaffMembers: [] as Array<{ name: string; rank: string }>,
      };
    }

    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    let compliantCrew = 0;
    let attentionCrew = 0;
    const actionCrew = 0;
    const squadMap: Record<string, SquadStats> = {};
    const commandStaffMembers: Array<{ name: string; rank: string }> = [];

    crew.forEach((member) => {
      const isCompliant = member.sailingCompliant || member.loaStatus;
      if (isCompliant) { compliantCrew++; } else { attentionCrew++; }

      const squad = member.squad;
      if (!squadMap[squad]) {
        squadMap[squad] = { name: squad, totalCount: 0, compliantCount: 0, attentionCount: 0, actionCount: 0, members: [] };
      }
      squadMap[squad].totalCount++;
      squadMap[squad].members.push({ name: member.name, rank: member.rank, sailingCompliant: member.sailingCompliant, loaStatus: member.loaStatus });
      if (isCompliant) { squadMap[squad].compliantCount++; } else { squadMap[squad].attentionCount++; }
      if (squad === 'Command Staff') { commandStaffMembers.push({ name: member.name, rank: member.rank }); }
    });

    const totalCrew = crew.length;
    return {
      totalCrew, compliantCrew, attentionCrew, actionCrew,
      compliancePercentage: totalCrew > 0 ? Math.round((compliantCrew / totalCrew) * 100) : 0,
      squadStats: Object.values(squadMap), commandStaffMembers,
    };
  };

  const getActionsCount = () => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return 0;
    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    let count = 0;
    crew.forEach((m) => {
      if (m.chatActivity === 0 && !m.loaStatus) count++;
      if (!m.sailingCompliant && !m.loaStatus) count++;
    });
    return count;
  };

  const leaderboardData = data.voyageAwards?.rows ? parseAllLeaderboardEntries(data.voyageAwards.rows) : [];
  const topHostsList = leaderboardData.length > 0 ? getTopHostsFromParser(leaderboardData, 5) : [];
  const topVoyagersList = leaderboardData.length > 0 ? getTopVoyagersFromParser(leaderboardData, 5) : [];

  const topHosts: TopVoyager[] = topHostsList.map((e: any) => ({ name: e.name, rank: e.rank, hosted: e.hostCount, voyages: e.voyageCount }));
  const topVoyages: TopVoyager[] = topVoyagersList.map((e: any) => ({ name: e.name, rank: e.rank, hosted: e.hostCount, voyages: e.voyageCount }));

  const crewAnalysis = analyzeCrewData();
  const actionsCount = getActionsCount();

  const getComplianceColor = (p: number) => { if (p > 75) return '#22c55e'; if (p >= 50) return '#eab308'; if (p >= 25) return '#f97316'; return '#ef4444'; };
  const complianceColor = getComplianceColor(crewAnalysis.compliancePercentage);

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Card sx={{ flex: 1 }}><CardContent><Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon sx={{ color: 'success.main' }} /><Typography color="textSecondary" variant="body2">Total Crew</Typography></Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{crewAnalysis.totalCrew}</Typography>
        </Stack></CardContent></Card>

        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.05)' }}><CardContent><Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleIcon sx={{ color: complianceColor }} /><Typography color="textSecondary" variant="body2">Sailing Compliance</Typography></Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff' }}>{crewAnalysis.compliancePercentage}%</Typography>
          <LinearProgress variant="determinate" value={crewAnalysis.compliancePercentage} sx={{ height: 6, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: complianceColor } }} />
        </Stack></CardContent></Card>

        <Card sx={{ flex: 1, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)' }}><CardContent><Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TaskAltIcon sx={{ color: '#3b82f6' }} /><Typography color="textSecondary" variant="body2">Actions Required</Typography></Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>{actionsCount}</Typography>
        </Stack></CardContent></Card>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Box sx={{ flex: 1 }}><Card><CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Compliance Breakdown</Typography>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={refreshData}>Refresh</Button>
          </Box>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Compliant (Sailed / On LOA)</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{crewAnalysis.compliantCrew}</Typography></Box>
              <LinearProgress variant="determinate" value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.compliantCrew / crewAnalysis.totalCrew) * 100 : 0} sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' } }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Attention Required (Not Sailed)</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{crewAnalysis.attentionCrew}</Typography></Box>
              <LinearProgress variant="determinate" value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.attentionCrew / crewAnalysis.totalCrew) * 100 : 0} sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'warning.main' } }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Action Required</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{crewAnalysis.actionCrew}</Typography></Box>
              <LinearProgress variant="determinate" value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.actionCrew / crewAnalysis.totalCrew) * 100 : 0} sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'error.main' } }} />
            </Box>
          </Stack>
        </CardContent></Card></Box>

        <Box sx={{ flex: 1 }}><Card><CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Ship Composition</Typography>
          <Stack spacing={2}>
            {crewAnalysis.squadStats.length === 0 ? (
              <Typography color="textSecondary">No squad data available</Typography>
            ) : (<>
              {crewAnalysis.squadStats.map((squad) => {
                if (squad.name !== 'Command Staff') return null;
                let coMember: string | null = null;
                let foMember: string | null = null;
                let cosMember: string | null = null;
                squad.members.forEach((m) => {
                  const nL = m.name.toLowerCase();
                  const rL = m.rank.toLowerCase();
                  if (rL.includes('commander') && !nL.includes('lady')) coMember = m.name;
                  else if (nL.includes('ladyhoit') || rL.includes('midship')) foMember = m.name;
                  else if (nL.includes('spice') || rL.includes('scpo') || rL.includes('senior chief')) cosMember = m.name;
                });
                return (
                  <Box key={squad.name}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Command</Typography>
                    <Tooltip title={coMember ? 'CO: ' + coMember : 'CO: Role available'}><Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: coMember ? '#FF5555' : '#9CA3AF', cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title={foMember ? 'FO: ' + foMember : 'FO: Role available'}><Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: foMember ? '#FF66B2' : '#9CA3AF', cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title={cosMember ? 'COS: ' + cosMember : 'COS: Role available'}><Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cosMember ? '#D946EF' : '#9CA3AF', cursor: 'pointer' }} /></Tooltip>
                  </Box></Box>
                );
              })}
              {crewAnalysis.squadStats.map((squad) => {
                if (squad.name === 'Command Staff') return null;
                const cP = squad.totalCount > 0 ? (squad.compliantCount / squad.totalCount) * 100 : 0;
                const aP = squad.totalCount > 0 ? (squad.attentionCount / squad.totalCount) * 100 : 0;
                const acP = squad.totalCount > 0 ? (squad.actionCount / squad.totalCount) * 100 : 0;
                return (
                  <Box key={squad.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{squad.name}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{squad.totalCount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', backgroundColor: 'action.disabledBackground' }}>
                      {cP > 0 && <Box sx={{ width: cP + '%', backgroundColor: '#22c55e' }} title={'Compliant: ' + squad.compliantCount} />}
                      {aP > 0 && <Box sx={{ width: aP + '%', backgroundColor: '#eab308' }} title={'Attention: ' + squad.attentionCount} />}
                      {acP > 0 && <Box sx={{ width: acP + '%', backgroundColor: '#ef4444' }} title={'Action: ' + squad.actionCount} />}
                    </Box>
                  </Box>
                );
              })}
            </>)}
          </Stack>
        </CardContent></Card></Box>
      </Stack>

      {(topHosts.length > 0 || topVoyages.length > 0) && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
          {topHosts.length > 0 && (
            <Card sx={{ flex: 1 }}><CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><TrendingUpIcon color="success" />Top Hosts</Typography>
              <TableContainer><Table size="small">
                <TableHead><TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Count</TableCell>
                </TableRow></TableHead>
                <TableBody>{topHosts.map((s, i) => (
                  <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell>{s.name}</TableCell>
                  <TableCell align="right"><Chip label={s.hosted} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} /></TableCell></TableRow>
                ))}</TableBody>
              </Table></TableContainer>
            </CardContent></Card>
          )}
          {topVoyages.length > 0 && (
            <Card sx={{ flex: 1 }}><CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><TrendingUpIcon color="success" />Top Voyagers</Typography>
              <TableContainer><Table size="small">
                <TableHead><TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Count</TableCell>
                </TableRow></TableHead>
                <TableBody>{topVoyages.map((s, i) => (
                  <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell>{s.name}</TableCell>
                  <TableCell align="right"><Chip label={s.voyages} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} /></TableCell></TableRow>
                ))}</TableBody>
              </Table></TableContainer>
            </CardContent></Card>
          )}
        </Stack>
      )}
    </Box>
  );
};
