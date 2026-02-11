import { useState, useMemo, useCallback } from 'react';
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
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useSheetData } from '../context/SheetDataContext';
import {
  parseAllCrewMembers,
  parseAllLeaderboardEntries,
  enrichCrewWithLeaderboardData,
} from '../services/dataParser';
import {
  AWARDS,
  CATEGORY_LABELS,
  type AwardDefinition,
  type AwardCategory,
} from '../config/AwardsConfig';
import { isRankAtOrAbove } from '../config/RankCodes';
import { buildKnownAwardsSet, isKnownAwarded } from '../config/KnownAwards';

// ==================== TYPES ====================

interface EligibleAward {
  award: AwardDefinition;
  sailorName: string;
  sailorRank: string;
  squad: string;
  responsible: string;
  /** The data value that triggered eligibility (for display) */
  currentValue: string;
  /** Whether this has been marked as awarded in localStorage */
  awarded: boolean;
}

type FilterTab = 'all' | 'co' | 'xo' | 'cos' | 'sl' | 'boa' | 'ref';

// ==================== SHARED STATE ====================

import { getStateSet, toggleInSet } from '../services/sharedState';

const STORAGE_KEY = 'awarded-medals';

const getAwardedSet = (): Set<string> => {
  return getStateSet(STORAGE_KEY);
};

const toggleAwarded = async (key: string): Promise<Set<string>> => {
  return toggleInSet(STORAGE_KEY, key);
};

// ==================== HELPERS ====================

const getResponsiblePerson = (
  responsibleRank: string,
  squad: string,
  commandStaff: { co: string | null; xo: string | null; cos: string | null; sls: Record<string, string> }
): string => {
  if (responsibleRank === 'SL/CoS') {
    const sl = commandStaff.sls[squad];
    if (sl) return sl;
    if (commandStaff.cos) return commandStaff.cos;
    if (commandStaff.xo) return commandStaff.xo;
    return commandStaff.co || 'Ship Command';
  }
  if (responsibleRank === 'CO') return commandStaff.co || 'Ship CO';

  // For rank-based: check if our CO/XO/CoS can award
  // E-6+ → SLs, CoS, XO, CO can all award
  // E-7+ → CoS, XO, CO
  // O-1+ → XO, CO
  // O-4+ → CO (if O-4+)
  // O-7+ → BOA (not our ship)
  if (isRankAtOrAbove('O-7', responsibleRank) || responsibleRank === 'O-7' || responsibleRank === 'O-8' || responsibleRank === 'O-9' || responsibleRank === 'O-10') {
    return 'Board of Admiralty';
  }
  if (responsibleRank === 'O-4') return commandStaff.co || 'Ship CO';
  if (responsibleRank === 'O-1') return commandStaff.xo || commandStaff.co || 'Junior Officer+';
  if (responsibleRank === 'E-7') return commandStaff.cos || commandStaff.xo || commandStaff.co || 'SNCO+';
  if (responsibleRank === 'E-6') {
    const sl = commandStaff.sls[squad];
    return sl || commandStaff.cos || commandStaff.xo || 'NCO+';
  }

  // External departments
  return responsibleRank;
};

// Filtering is now by responsible person, not category

const getSeverityColor = (tier: number): string => {
  if (tier >= 4) return '#dc2626'; // High tier → red
  if (tier >= 2) return '#f97316'; // Mid tier → orange
  return '#eab308'; // Low tier → yellow
};

// ==================== COMPONENT ====================

export const AwardsTab = () => {
  const { data, loading } = useSheetData();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [awardedTick, setAwardedTick] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Parse command staff for responsible-person mapping
  const commandStaff = useMemo(() => {
    const result: { co: string | null; xo: string | null; cos: string | null; sls: Record<string, string> } = {
      co: null, xo: null, cos: null, sls: {},
    };
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return result;
    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    crew.forEach((m) => {
      const rL = m.rank.toLowerCase();
      const nL = m.name.toLowerCase();
      if (!result.co && (rL.includes('commander') && !rL.includes('midship') && !nL.includes('lady') && !nL.includes('spice'))) result.co = m.name;
      if (!result.xo && (nL.includes('ladyhoit') || rL.includes('midship'))) result.xo = m.name;
      if (!result.cos && (nL.includes('spice') || rL.includes('scpo') || rL.includes('senior chief'))) result.cos = m.name;
      // Squad leaders: E-6 or E-7 who are listed as squad leaders (simplistic: first NCO+ per squad)
    });
    // Identify SLs per squad
    const squads = new Set(crew.map((m) => m.squad).filter((s) => s !== 'Command Staff' && s !== 'Unassigned'));
    squads.forEach((sq) => {
      const sqMembers = crew.filter((m) => m.squad === sq);
      const sl = sqMembers.find((m) => {
        const rL = m.rank.toLowerCase();
        return rL.includes('chief petty') || rL.includes('petty officer') || rL.includes('cpo') || rL.includes('scpo');
      });
      if (sl) result.sls[sq] = sl.name;
    });
    return result;
  }, [data.gullinbursti]);

  // Generate eligible awards from sheet data
  const eligibleAwards = useMemo(() => {
    void awardedTick; // Re-run when awards toggled
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return [];

    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    const leaderboardData = data.voyageAwards?.rows ? parseAllLeaderboardEntries(data.voyageAwards.rows) : [];
    const enrichedCrew = crew.map((m) => enrichCrewWithLeaderboardData(m, leaderboardData));
    const awardedSet = getAwardedSet();
    const knownSet = buildKnownAwardsSet();
    const now = new Date();

    const results: EligibleAward[] = [];

    enrichedCrew.forEach((member) => {
      if (member.loaStatus) return; // Skip LOA

      const voyages = member.voyageCount || 0;
      const hosted = member.hostCount || 0;
      const chat = member.chatActivity || 0;

      // Calculate service months from leaderboard joinDate
      let serviceMonths = 0;
      const lbEntry = leaderboardData.find(
        (l) => l.name.toLowerCase().trim() === member.name.toLowerCase().trim()
      );
      if (lbEntry?.joinDate) {
        const jd = new Date(lbEntry.joinDate);
        if (!isNaN(jd.getTime())) {
          serviceMonths = Math.floor((now.getTime() - jd.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        }
      }

      // Check each auto-detect award
      AWARDS.filter((a) => a.autoDetect && a.thresholds).forEach((award) => {
        const t = award.thresholds!;
        let eligible = true;
        let valueStr = '';

        if (t.voyages !== undefined) {
          if (voyages < t.voyages) eligible = false;
          else valueStr = `${voyages} voyages`;
        }
        if (t.hosted !== undefined) {
          if (hosted < t.hosted) eligible = false;
          else valueStr = `${hosted} hosted`;
        }
        if (t.chatActivityMin !== undefined) {
          if (chat < t.chatActivityMin) eligible = false;
        }
        if (t.serviceMonths !== undefined) {
          if (serviceMonths < t.serviceMonths) eligible = false;
          else valueStr = `${serviceMonths} months`;
        }

        if (eligible) {
          const key = `${award.id}::${member.name}`;
          results.push({
            award,
            sailorName: member.name,
            sailorRank: member.rank,
            squad: member.squad,
            responsible: getResponsiblePerson(award.responsibleRank, member.squad, commandStaff),
            currentValue: valueStr,
            awarded: awardedSet.has(key) || isKnownAwarded(knownSet, award.id, member.name),
          });
        }
      });
    });

    // Sort: unawarded first, then by tier (highest first), then by name
    results.sort((a, b) => {
      if (a.awarded !== b.awarded) return a.awarded ? 1 : -1;
      if (a.award.tier !== b.award.tier) return b.award.tier - a.award.tier;
      return a.sailorName.localeCompare(b.sailorName);
    });

    return results;
  }, [data.gullinbursti, data.voyageAwards, commandStaff, awardedTick]);

  const handleToggleAwarded = useCallback(async (awardId: string, sailorName: string) => {
    const key = `${awardId}::${sailorName}`;
    await toggleAwarded(key);
    setAwardedTick((t) => t + 1);
  }, []);

  // Filter by tab (responsible person)
  const filtered = useMemo(() => {
    if (activeTab === 'all') return eligibleAwards;
    if (activeTab === 'ref') return eligibleAwards; // ref tab shows reference, not table
    // Map tab to responsible person name
    const matchPerson = (responsible: string): boolean => {
      const r = responsible.toLowerCase();
      switch (activeTab) {
        case 'co': return r.includes('hoit') && !r.includes('lady');
        case 'xo': return r.includes('ladyhoit') || r.includes('lady');
        case 'cos': return r.includes('spice');
        case 'sl': return r.includes('necro') || r.includes('shade');
        case 'boa': return r.includes('admiralty') || r.includes('fleet');
        default: return false;
      }
    };
    return eligibleAwards.filter((e) => matchPerson(e.responsible));
  }, [eligibleAwards, activeTab]);

  // Summary counts by responsible person
  const counts = useMemo(() => {
    const pending = eligibleAwards.filter((e) => !e.awarded);
    const byPerson = (test: (r: string) => boolean) => pending.filter((e) => test(e.responsible.toLowerCase())).length;
    return {
      total: pending.length,
      co: byPerson((r) => r.includes('hoit') && !r.includes('lady')),
      xo: byPerson((r) => r.includes('ladyhoit') || r.includes('lady')),
      cos: byPerson((r) => r.includes('spice')),
      sl: byPerson((r) => r.includes('necro') || r.includes('shade')),
      boa: byPerson((r) => r.includes('admiralty') || r.includes('fleet')),
    };
  }, [eligibleAwards]);

  // All awards grouped by category (for the reference section)
  const allAwardsByCategory = useMemo(() => {
    const map: Partial<Record<AwardCategory, AwardDefinition[]>> = {};
    AWARDS.forEach((a) => {
      if (!map[a.category]) map[a.category] = [];
      map[a.category]!.push(a);
    });
    return map;
  }, []);

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Card sx={{ flex: 1, minHeight: 100 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: '#eab308' }} />
                <Typography color="textSecondary" variant="body2">Eligible Awards</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#eab308' }}>{counts.total}</Typography>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minHeight: 100, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MilitaryTechIcon sx={{ color: '#3b82f6' }} />
                <Typography color="textSecondary" variant="body2">By Responsible</Typography>
              </Box>
              <Stack direction="row" spacing={3} alignItems="baseline">
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#FF5555', lineHeight: 1 }}>{counts.co}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>CO</Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#FF66B2', lineHeight: 1 }}>{counts.xo}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>XO</Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#D946EF', lineHeight: 1 }}>{counts.cos}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>CoS</Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#60A5FA', lineHeight: 1 }}>{counts.sl}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>SL</Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#eab308', lineHeight: 1 }}>{counts.boa}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>BOA</Typography>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Filter tabs — by responsible person */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 80 } }}
        >
          <Tab label={`All (${counts.total})`} value="all" />
          <Tab label={`CO (${counts.co})`} value="co" />
          <Tab label={`XO (${counts.xo})`} value="xo" />
          <Tab label={`CoS (${counts.cos})`} value="cos" />
          <Tab label={`SL (${counts.sl})`} value="sl" />
          <Tab label={`BOA (${counts.boa})`} value="boa" />
          <Tab label="All Awards Ref" value="ref" />
        </Tabs>
      </Box>

      {/* Main content: eligible list or reference table */}
      {activeTab !== 'ref' ? (
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            {filtered.length === 0 ? (
              <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No eligible awards detected. Connect your sheets or check that voyage/host data is populated.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Award</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Squad</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Awarded By</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Done</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((e, i) => (
                      <TableRow
                        key={`${e.award.id}-${e.sailorName}-${i}`}
                        sx={{
                          opacity: e.awarded ? 0.45 : 1,
                          textDecoration: e.awarded ? 'line-through' : 'none',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <TableCell>
                          <Tooltip title={e.award.requirements} arrow>
                            <Chip
                              label={e.award.name}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                backgroundColor: getSeverityColor(e.award.tier) + '22',
                                color: getSeverityColor(e.award.tier),
                                border: `1px solid ${getSeverityColor(e.award.tier)}44`,
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{e.sailorName}</Typography>
                          <Typography variant="caption" color="textSecondary">{e.sailorRank}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{e.squad}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 500 }}>{e.currentValue}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{e.responsible}</Typography></TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Tooltip title={e.awarded ? 'Mark as not awarded' : 'Mark as awarded'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleAwarded(e.award.id, e.sailorName)}
                              sx={{ color: e.awarded ? '#22c55e' : 'text.disabled' }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Awards Reference — all awards grouped by category */
        <Stack spacing={1}>
          {Object.entries(allAwardsByCategory).map(([cat, awards]) => (
            <Card key={cat}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {CATEGORY_LABELS[cat as AwardCategory] || cat} ({awards!.length})
                  </Typography>
                  <IconButton size="small">
                    {expandedCategory === cat ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={expandedCategory === cat}>
                  <TableContainer sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Award</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Requirements</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Awarded By</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Auto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {awards!.sort((a, b) => a.tier - b.tier).map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{a.requirements}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{a.responsibleRank}</Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {a.autoDetect ? (
                                <Chip label="Auto" size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                              ) : (
                                <Chip label="Manual" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
