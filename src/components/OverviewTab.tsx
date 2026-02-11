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
  LinearProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useSheetData } from '../context/SheetDataContext';
import {
  parseAllCrewMembers,
  parseAllLeaderboardEntries,
  enrichCrewWithLeaderboardData,
  getTopHosts as getTopHostsFromParser,
  getTopVoyagers as getTopVoyagersFromParser,
} from '../services/dataParser';

interface SquadStats {
  name: string;
  totalCount: number;
  compliantCount: number;
  attentionCount: number;
  actionCount: number;
  attentionNames: string[];
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

interface OverviewTabProps {
  onNavigateToActions?: () => void;
}

export const OverviewTab = ({ onNavigateToActions }: OverviewTabProps = {}) => {
  const { data, loading } = useSheetData();
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
        attentionNames: [] as string[],
      };
    }

    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    let compliantCrew = 0;
    let attentionCrew = 0;
    const actionCrew = 0;
    const attentionNames: string[] = [];
    const squadMap: Record<string, SquadStats> = {};
    const commandStaffMembers: Array<{ name: string; rank: string }> = [];

    crew.forEach((member) => {
      const isCompliant = member.sailingCompliant || member.loaStatus;
      if (isCompliant) { compliantCrew++; } else { attentionCrew++; attentionNames.push(member.name); }

      const squad = member.squad;
      if (!squadMap[squad]) {
        squadMap[squad] = { name: squad, totalCount: 0, compliantCount: 0, attentionCount: 0, actionCount: 0, attentionNames: [], members: [] };
      }
      squadMap[squad].totalCount++;
      squadMap[squad].members.push({ name: member.name, rank: member.rank, sailingCompliant: member.sailingCompliant, loaStatus: member.loaStatus });
      if (isCompliant) { squadMap[squad].compliantCount++; } else { squadMap[squad].attentionCount++; squadMap[squad].attentionNames.push(member.name); }
      if (squad === 'Command Staff') { commandStaffMembers.push({ name: member.name, rank: member.rank }); }
    });

    const totalCrew = crew.length;
    return {
      totalCrew, compliantCrew, attentionCrew, actionCrew, attentionNames,
      compliancePercentage: totalCrew > 0 ? Math.round((compliantCrew / totalCrew) * 100) : 0,
      squadStats: Object.values(squadMap), commandStaffMembers,
    };
  };

  const leaderboardData = data.voyageAwards?.rows ? parseAllLeaderboardEntries(data.voyageAwards.rows) : [];
  const topHostsList = leaderboardData.length > 0 ? getTopHostsFromParser(leaderboardData, 10) : [];
  const topVoyagersList = leaderboardData.length > 0 ? getTopVoyagersFromParser(leaderboardData, 10) : [];

  const getActionsCounts = () => {
    let high = 0, medium = 0, low = 0;

    if (data.gullinbursti && data.gullinbursti.rows.length > 0) {
      const crew = parseAllCrewMembers(data.gullinbursti.rows);
      const enrichedCrew = crew.map((m) => enrichCrewWithLeaderboardData(m, leaderboardData));
      const now = new Date();

      enrichedCrew.forEach((member) => {
        if (member.loaStatus) return;
        if (!member.sailingCompliant) {
          let days = 0;
          if (member.lastVoyageDate) { const lv = new Date(member.lastVoyageDate); if (!isNaN(lv.getTime())) days = Math.floor((now.getTime() - lv.getTime()) / (1000 * 60 * 60 * 24)); }
          else days = member.daysInactive;
          if (days >= 30) high++; else medium++;
        }
        if (member.canHostRank && !member.hostingCompliant) {
          let days = 0;
          if (member.lastHostDate) { const lh = new Date(member.lastHostDate); if (!isNaN(lh.getTime())) days = Math.floor((now.getTime() - lh.getTime()) / (1000 * 60 * 60 * 24)); }
          if (days >= 14) high++; else medium++;
        }
        if (member.chatActivity === 0) low++;
      });
    }

    // Include manual actions from localStorage (exclude recurring)
    try {
      const manual: Array<{ severity: string; cadence?: string }> = JSON.parse(localStorage.getItem('manual-actions') || '[]');
      manual.forEach((ma) => {
        if (ma.severity === 'high') high++;
        else if (ma.severity === 'medium') medium++;
        else low++;
      });
    } catch { /* ignore */ }

    return { total: high + medium + low, high, medium, low };
  };

  const topHosts: TopVoyager[] = topHostsList.map((e: any) => ({ name: e.name, rank: e.rank, hosted: e.hostCount, voyages: e.voyageCount }));
  const topVoyages: TopVoyager[] = topVoyagersList.map((e: any) => ({ name: e.name, rank: e.rank, hosted: e.hostCount, voyages: e.voyageCount }));

  const crewAnalysis = analyzeCrewData();
  const actionsCounts = getActionsCounts();

  const getComplianceColor = (p: number) => { if (p > 75) return '#22c55e'; if (p >= 50) return '#eab308'; if (p >= 25) return '#f97316'; return '#ef4444'; };
  const complianceColor = getComplianceColor(crewAnalysis.compliancePercentage);

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Card sx={{ flex: 1, minHeight: 120 }}><CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon sx={{ color: 'success.main' }} /><Typography color="textSecondary" variant="body2">Sailors</Typography></Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{crewAnalysis.totalCrew}</Typography>
        </Stack></CardContent></Card>

        <Card sx={{ flex: 1, minHeight: 120, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.05)' }}><CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleIcon sx={{ color: complianceColor }} /><Typography color="textSecondary" variant="body2">Compliance</Typography></Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff' }}>{crewAnalysis.compliancePercentage}%</Typography>
          <LinearProgress variant="determinate" value={crewAnalysis.compliancePercentage} sx={{ height: 6, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: complianceColor } }} />
        </Stack></CardContent></Card>

        <Card sx={{ flex: 1, minHeight: 120, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', cursor: onNavigateToActions ? 'pointer' : 'default', '&:hover': onNavigateToActions ? { boxShadow: 4 } : {} }} onClick={onNavigateToActions}><CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TaskAltIcon sx={{ color: '#3b82f6' }} /><Typography color="textSecondary" variant="body2">Actions</Typography></Box>
          <Stack direction="row" spacing={3} alignItems="baseline">
            <Tooltip title="High Priority"><Typography sx={{ fontWeight: 'bold', fontSize: '1.8rem', color: '#dc2626', lineHeight: 1 }}>{actionsCounts.high}</Typography></Tooltip>
            <Tooltip title="Medium Priority"><Typography sx={{ fontWeight: 'bold', fontSize: '1.8rem', color: '#f97316', lineHeight: 1 }}>{actionsCounts.medium}</Typography></Tooltip>
            <Tooltip title="Low Priority"><Typography sx={{ fontWeight: 'bold', fontSize: '1.8rem', color: '#eab308', lineHeight: 1 }}>{actionsCounts.low}</Typography></Tooltip>
          </Stack>
        </Stack></CardContent></Card>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, alignItems: 'stretch' }} useFlexGap>
        <Box sx={{ flex: 1, display: 'flex' }}><Card sx={{ flex: 1 }}><CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Compliance Breakdown</Typography>
          </Box>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Compliant (Sailed / On LOA)</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>{crewAnalysis.compliantCrew}</Typography></Box>
              <LinearProgress variant="determinate" value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.compliantCrew / crewAnalysis.totalCrew) * 100 : 0} sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' } }} />
            </Box>
            <Tooltip title={crewAnalysis.attentionNames.length > 0 ? crewAnalysis.attentionNames.join(', ') : ''} arrow placement="bottom">
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Attention Required (Not Sailed)</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{crewAnalysis.attentionCrew}</Typography></Box>
                <LinearProgress variant="determinate" value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.attentionCrew / crewAnalysis.totalCrew) * 100 : 0} sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'warning.main' } }} />
              </Box>
            </Tooltip>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Action Required</Typography><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>{crewAnalysis.actionCrew}</Typography></Box>
              <LinearProgress variant="determinate" value={crewAnalysis.totalCrew > 0 ? (crewAnalysis.actionCrew / crewAnalysis.totalCrew) * 100 : 0} sx={{ height: 8, borderRadius: 1, backgroundColor: 'action.disabledBackground', '& .MuiLinearProgress-bar': { backgroundColor: 'error.main' } }} />
            </Box>
          </Stack>
        </CardContent></Card></Box>

        <Box sx={{ flex: 1, display: 'flex' }}><Card sx={{ flex: 1 }}><CardContent>
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
                  // CO: rank is "Lt. Commander" or "Commander" (but not "Lt." alone) — match first found only
                  if (!coMember && (rL === 'lt. commander' || rL === 'commander' || (rL.includes('commander') && !rL.includes('midship')))) {
                    // Exclude FO/CoS names to avoid false matches
                    if (!nL.includes('lady') && !nL.includes('spice')) coMember = m.name;
                  }
                  // FO: match by name (LadyHoit) or rank (Midshipwoman/Midshipman)
                  if (!foMember && (nL.includes('ladyhoit') || rL.includes('midship'))) foMember = m.name;
                  // CoS: match by name (Spice) or rank (SCPO/Senior Chief)
                  if (!cosMember && (nL.includes('spice') || rL.includes('scpo') || rL.includes('senior chief'))) cosMember = m.name;
                });
                return (
                  <Box key={squad.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
                      {/* CO */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={coMember ? 'Commanding Officer' : 'CO: Role available'}>
                          <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: coMember ? '#FF5555' : '#9CA3AF', cursor: 'pointer', boxShadow: coMember ? '0 0 8px rgba(255,85,85,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', lineHeight: 1 }}>CO</Typography>
                          </Box>
                        </Tooltip>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: '#fff' }}>{coMember || '—'}</Typography>
                      </Box>
                      {/* FO */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={foMember ? 'First Officer' : 'FO: Role available'}>
                          <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: foMember ? '#FF66B2' : '#9CA3AF', cursor: 'pointer', boxShadow: foMember ? '0 0 8px rgba(255,102,178,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', lineHeight: 1 }}>FO</Typography>
                          </Box>
                        </Tooltip>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: '#fff' }}>{foMember || '—'}</Typography>
                      </Box>
                      {/* CoS */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={cosMember ? 'Chief of Ship' : 'CoS: Role available'}>
                          <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: cosMember ? '#D946EF' : '#9CA3AF', cursor: 'pointer', boxShadow: cosMember ? '0 0 8px rgba(217,70,239,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', lineHeight: 1 }}>CoS</Typography>
                          </Box>
                        </Tooltip>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: '#fff' }}>{cosMember || '—'}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              {crewAnalysis.squadStats.map((squad) => {
                if (squad.name === 'Command Staff') return null;
                const cP = squad.totalCount > 0 ? (squad.compliantCount / squad.totalCount) * 100 : 0;
                const aP = squad.totalCount > 0 ? (squad.attentionCount / squad.totalCount) * 100 : 0;
                const acP = squad.totalCount > 0 ? (squad.actionCount / squad.totalCount) * 100 : 0;
                const attentionTooltip = squad.attentionNames.length > 0 ? squad.attentionNames.join(', ') : '';
                return (
                  <Tooltip key={squad.name} title={attentionTooltip} arrow placement="bottom">
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{squad.name}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{squad.totalCount}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', backgroundColor: 'action.disabledBackground' }}>
                        {cP > 0 && <Box sx={{ width: cP + '%', backgroundColor: '#22c55e' }} />}
                        {aP > 0 && <Box sx={{ width: aP + '%', backgroundColor: '#eab308' }} />}
                        {acP > 0 && <Box sx={{ width: acP + '%', backgroundColor: '#ef4444' }} />}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </>)}
          </Stack>
        </CardContent></Card></Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Card sx={{ flex: 1 }}><CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><TrendingUpIcon color="success" />Top 10 Voyagers</Typography>
          {topVoyages.length > 0 ? (
            <TableContainer><Table size="small">
              <TableHead><TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Count</TableCell>
              </TableRow></TableHead>
              <TableBody>{topVoyages.map((s, i) => (
                <TableRow key={i}><TableCell>{i === 0 ? '👑' : i + 1}</TableCell><TableCell>{s.name}</TableCell>
                <TableCell align="right"><Chip label={s.voyages} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} /></TableCell></TableRow>
              ))}</TableBody>
            </Table></TableContainer>
          ) : (
            <Typography color="textSecondary" variant="body2">No voyage data available yet. Check that the Time/Voyage Awards sheet is connected.</Typography>
          )}
        </CardContent></Card>

        <Card sx={{ flex: 1 }}><CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><TrendingUpIcon color="success" />Top 10 Hosts</Typography>
          {topHosts.length > 0 ? (
            <TableContainer><Table size="small">
              <TableHead><TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Count</TableCell>
              </TableRow></TableHead>
              <TableBody>{topHosts.map((s, i) => (
                <TableRow key={i}><TableCell>{i === 0 ? '👑' : i + 1}</TableCell><TableCell>{s.name}</TableCell>
                <TableCell align="right"><Chip label={s.hosted} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} /></TableCell></TableRow>
              ))}</TableBody>
            </Table></TableContainer>
          ) : (
            <Typography color="textSecondary" variant="body2">No hosting data available yet. Check that the Time/Voyage Awards sheet is connected.</Typography>
          )}
        </CardContent></Card>
      </Stack>
    </Box>
  );
};
