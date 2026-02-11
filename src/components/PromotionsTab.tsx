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
  LinearProgress,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useSheetData } from '../context/SheetDataContext';
import {
  parseAllCrewMembers,
  parseAllLeaderboardEntries,
  enrichCrewWithLeaderboardData,
} from '../services/dataParser';
import { resolveRank } from '../config/RankCodes';
import {
  PROMOTION_PATHS,
  checkAutoPrereqs,
  type PromotionPath,
} from '../config/PromotionsConfig';

// ==================== TYPES ====================

interface PromotionCandidate {
  sailorName: string;
  sailorRank: string;
  rankCode: string;
  squad: string;
  promotionPath: PromotionPath;
  responsible: string;
  /** Number of auto-detect prereqs met vs total auto-detect prereqs */
  autoMet: number;
  autoTotal: number;
  /** Per-prerequisite status (true = met, false = not met, undefined = manual) */
  prereqStatus: Record<string, boolean | undefined>;
  /** Data values for display */
  voyages: number;
  hosted: number;
  serviceMonths: number;
  /** Readiness percentage (auto-detect only) */
  readiness: number;
  /** Manually marked as promoted */
  promoted: boolean;
}

type FilterTab = 'all' | 'co' | 'fo' | 'cos' | 'sl1' | 'sl2' | 'boa';

// ==================== SHARED STATE ====================

import { getStateSet, toggleInSet, getStateRecord, toggleInRecord } from '../services/sharedState';

const STORAGE_KEY = 'promoted-sailors';
const MANUAL_CHECK_KEY = 'promotion-manual-checks';

const getPromotedSet = (): Set<string> => {
  return getStateSet(STORAGE_KEY);
};

const togglePromoted = async (key: string): Promise<void> => {
  await toggleInSet(STORAGE_KEY, key);
};

const getManualChecks = (): Record<string, boolean> => {
  return getStateRecord<boolean>(MANUAL_CHECK_KEY);
};

const toggleManualCheck = async (key: string): Promise<void> => {
  await toggleInRecord(MANUAL_CHECK_KEY, key);
};

// ==================== HELPERS ====================

const getResponsiblePerson = (
  responsibleRank: string,
  squad: string,
  sailorName: string,
  commandStaff: { co: string | null; fo: string | null; cos: string | null; slsBySquad: Record<string, string> }
): string => {
  // Chain of command for escalation: SL → CoS → FO → CO → BOA
  const chain = [
    commandStaff.slsBySquad[squad] || null,
    commandStaff.cos,
    commandStaff.fo,
    commandStaff.co,
  ].filter(Boolean) as string[];

  const escalate = (person: string): string => {
    if (person.toLowerCase() !== sailorName.toLowerCase()) return person;
    // Person can't promote themselves — find next up in chain
    const idx = chain.findIndex((p) => p.toLowerCase() === person.toLowerCase());
    for (let i = idx + 1; i < chain.length; i++) {
      if (chain[i].toLowerCase() !== sailorName.toLowerCase()) return chain[i];
    }
    return 'Board of Admiralty';
  };

  switch (responsibleRank) {
    case 'SL': {
      const sl = commandStaff.slsBySquad[squad];
      return sl ? escalate(sl) : (commandStaff.cos ? escalate(commandStaff.cos) : 'Squad Leader');
    }
    case 'CoS': {
      const person = commandStaff.cos || commandStaff.fo || commandStaff.co;
      return person ? escalate(person) : 'Chief of Ship';
    }
    case 'CO': return commandStaff.co ? escalate(commandStaff.co) : 'Ship CO';
    case 'BOA': return 'Board of Admiralty';
    case 'Fleet': return 'Fleet Commander';
    default: return responsibleRank;
  }
};

const getReadinessColor = (pct: number): string => {
  if (pct >= 100) return '#22c55e';
  if (pct >= 66) return '#eab308';
  if (pct >= 33) return '#f97316';
  return '#ef4444';
};

// ==================== COMPONENT ====================

export const PromotionsTab = () => {
  const { data, loading } = useSheetData();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [tick, setTick] = useState(0);

  // Parse command staff
  const commandStaff = useMemo(() => {
    const result: { co: string | null; fo: string | null; cos: string | null; slsBySquad: Record<string, string> } = {
      co: null, fo: null, cos: null, slsBySquad: {},
    };
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return result;
    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    crew.forEach((m) => {
      const rL = m.rank.toLowerCase();
      const nL = m.name.toLowerCase();
      if (!result.co && rL.includes('commander') && !rL.includes('midship') && !nL.includes('lady') && !nL.includes('spice')) result.co = m.name;
      if (!result.fo && (nL.includes('ladyhoit') || rL.includes('midship'))) result.fo = m.name;
      if (!result.cos && (nL.includes('spice') || rL.includes('scpo') || rL.includes('senior chief'))) result.cos = m.name;
    });
    // SLs — map per squad
    const squads = new Set(crew.map((m) => m.squad).filter((s) => s !== 'Command Staff' && s !== 'Unassigned'));
    squads.forEach((sq) => {
      const sqMembers = crew.filter((m) => m.squad === sq);
      const sl = sqMembers.find((m) => {
        const rL = m.rank.toLowerCase();
        return rL.includes('chief petty') || rL.includes('petty officer') || rL.includes('cpo') || rL.includes('scpo');
      });
      if (sl) result.slsBySquad[sq] = sl.name;
    });
    return result;
  }, [data.gullinbursti]);

  // Generate promotion candidates
  const candidates = useMemo(() => {
    void tick;
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return [];

    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    const leaderboardData = data.voyageAwards?.rows ? parseAllLeaderboardEntries(data.voyageAwards.rows) : [];
    const enrichedCrew = crew.map((m) => enrichCrewWithLeaderboardData(m, leaderboardData));
    const promotedSet = getPromotedSet();
    const manualChecks = getManualChecks();
    const now = new Date();

    const results: PromotionCandidate[] = [];

    enrichedCrew.forEach((member) => {
      if (member.loaStatus) return;

      const rank = resolveRank(member.rank);
      if (!rank) return;

      const promotionPath = PROMOTION_PATHS.find((p) => p.fromRank === rank.code);
      if (!promotionPath) return; // No promotion path for this rank (e.g. O-6+)

      const voyages = member.voyageCount || 0;
      const hosted = member.hostCount || 0;

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

      const autoResult = checkAutoPrereqs(promotionPath, voyages, hosted, member.chatActivity || 0, serviceMonths);

      // Build full prerequisite status including manual checks
      const prereqStatus: Record<string, boolean | undefined> = {};
      promotionPath.prerequisites.forEach((p) => {
        if (p.autoDetect) {
          prereqStatus[p.id] = autoResult.details[p.id] ?? false;
        } else {
          const manualKey = `${member.name}::${p.id}`;
          prereqStatus[p.id] = manualChecks[manualKey] || false;
        }
      });

      // Total readiness: count all met (auto + manual)
      const totalPrereqs = promotionPath.prerequisites.length;
      const totalMet = Object.values(prereqStatus).filter((v) => v === true).length;
      const readiness = totalPrereqs > 0 ? Math.round((totalMet / totalPrereqs) * 100) : 0;

      const key = `${promotionPath.fromRank}-${promotionPath.toRank}::${member.name}`;

      results.push({
        sailorName: member.name,
        sailorRank: member.rank,
        rankCode: rank.code,
        squad: member.squad,
        promotionPath,
        responsible: getResponsiblePerson(promotionPath.responsibleRank, member.squad, member.name, commandStaff),
        autoMet: autoResult.met,
        autoTotal: autoResult.total,
        prereqStatus,
        voyages,
        hosted,
        serviceMonths,
        readiness,
        promoted: promotedSet.has(key),
      });
    });

    // Sort: not promoted first, then by readiness desc, then name
    results.sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? 1 : -1;
      return b.readiness - a.readiness || a.sailorName.localeCompare(b.sailorName);
    });

    return results;
  }, [data.gullinbursti, data.voyageAwards, commandStaff, tick]);

  const handleTogglePromoted = useCallback(async (candidate: PromotionCandidate) => {
    const key = `${candidate.promotionPath.fromRank}-${candidate.promotionPath.toRank}::${candidate.sailorName}`;
    await togglePromoted(key);
    setTick((t) => t + 1);
  }, []);

  const handleToggleManualCheck = useCallback(async (sailorName: string, prereqId: string) => {
    const key = `${sailorName}::${prereqId}`;
    await toggleManualCheck(key);
    setTick((t) => t + 1);
  }, []);

  // Filter by tab
  const filtered = useMemo(() => {
    if (activeTab === 'all') return candidates;
    const matchPerson = (responsible: string): boolean => {
      const r = responsible.toLowerCase();
      switch (activeTab) {
        case 'co': return r.includes('hoit') && !r.includes('lady');
        case 'fo': return r.includes('ladyhoit') || r.includes('lady');
        case 'cos': return r.includes('spice');
        case 'sl1': return r.includes('necro');
        case 'sl2': return r.includes('shade');
        case 'boa': return r.includes('admiralty') || r.includes('fleet');
        default: return false;
      }
    };
    return candidates.filter((c) => matchPerson(c.responsible));
  }, [candidates, activeTab]);

  // Counts by responsible person
  const counts = useMemo(() => {
    const pending = candidates.filter((c) => !c.promoted);
    const byPerson = (test: (r: string) => boolean) => pending.filter((c) => test(c.responsible.toLowerCase())).length;
    return {
      total: pending.length,
      co: byPerson((r) => r.includes('hoit') && !r.includes('lady')),
      fo: byPerson((r) => r.includes('ladyhoit') || r.includes('lady')),
      cos: byPerson((r) => r.includes('spice')),
      sl1: byPerson((r) => r.includes('necro')),
      sl2: byPerson((r) => r.includes('shade')),
      boa: byPerson((r) => r.includes('admiralty') || r.includes('fleet')),
    };
  }, [candidates]);

  // Readiness summary
  const readyCounts = useMemo(() => {
    const pending = candidates.filter((c) => !c.promoted);
    return {
      ready: pending.filter((c) => c.readiness === 100).length,
      close: pending.filter((c) => c.readiness >= 50 && c.readiness < 100).length,
      early: pending.filter((c) => c.readiness < 50).length,
    };
  }, [candidates]);

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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'center' }} useFlexGap>
        <Card sx={{ minWidth: 200, minHeight: 100 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowUpwardIcon sx={{ color: '#3b82f6' }} />
                <Typography color="textSecondary" variant="body2">Promotion Candidates</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{counts.total}</Typography>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200, minHeight: 100 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowUpwardIcon sx={{ color: '#22c55e' }} />
                <Typography color="textSecondary" variant="body2">Readiness</Typography>
              </Box>
              <Stack direction="row" spacing={3} alignItems="baseline">
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#22c55e', lineHeight: 1 }}>{readyCounts.ready}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>Ready</Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#eab308', lineHeight: 1 }}>{readyCounts.close}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>Close</Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#ef4444', lineHeight: 1 }}>{readyCounts.early}</Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>Early</Typography>
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
          <Tab label={`SL1 (${counts.sl1})`} value="sl1" />
          <Tab label={`SL2 (${counts.sl2})`} value="sl2" />
          <Tab label={`CoS (${counts.cos})`} value="cos" />
          <Tab label={`FO (${counts.fo})`} value="fo" />
          <Tab label={`CO (${counts.co})`} value="co" />
          <Tab label={`BOA (${counts.boa})`} value="boa" />
        </Tabs>
      </Box>

      {/* Promotions table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {filtered.length === 0 ? (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No promotion candidates detected. Connect your sheets or check that crew data is populated.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Promotion</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Readiness</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Prerequisites</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Approved By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Promoted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((c, i) => {
                    const readinessColor = getReadinessColor(c.readiness);
                    return (
                      <TableRow
                        key={`${c.sailorName}-${c.promotionPath.fromRank}-${i}`}
                        sx={{
                          opacity: c.promoted ? 0.4 : 1,
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.sailorName}</Typography>
                          <Typography variant="caption" color="textSecondary">{c.sailorRank}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.promotionPath.label}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              backgroundColor: readinessColor + '22',
                              color: readinessColor,
                              border: `1px solid ${readinessColor}44`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: readinessColor }}>
                              {c.readiness}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={c.readiness}
                              sx={{
                                height: 6,
                                borderRadius: 1,
                                backgroundColor: 'action.disabledBackground',
                                '& .MuiLinearProgress-bar': { backgroundColor: readinessColor },
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            {c.promotionPath.prerequisites.map((p) => {
                              const met = c.prereqStatus[p.id];
                              const isManual = !p.autoDetect;
                              return (
                                <Box
                                  key={p.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    cursor: isManual ? 'pointer' : 'default',
                                  }}
                                  onClick={isManual ? () => handleToggleManualCheck(c.sailorName, p.id) : undefined}
                                >
                                  {met ? (
                                    <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                                  ) : (
                                    <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  )}
                                  <Tooltip title={isManual ? 'Click to toggle (manual check)' : 'Auto-detected from data'} arrow>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        textDecoration: met ? 'line-through' : 'none',
                                        color: met ? 'text.disabled' : 'text.primary',
                                        fontStyle: isManual ? 'italic' : 'normal',
                                      }}
                                    >
                                      {p.label}
                                      {!isManual && p.threshold?.voyages ? ` (${c.voyages}/${p.threshold.voyages})` : ''}
                                      {!isManual && p.threshold?.hosted ? ` (${c.hosted}/${p.threshold.hosted})` : ''}
                                      {!isManual && p.threshold?.serviceMonths ? ` (${c.serviceMonths}/${p.threshold.serviceMonths}mo)` : ''}
                                    </Typography>
                                  </Tooltip>
                                </Box>
                              );
                            })}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{c.responsible}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Tooltip title={c.promoted ? 'Undo promotion' : 'Mark as promoted'}>
                            <IconButton
                              size="small"
                              onClick={() => handleTogglePromoted(c)}
                              sx={{ color: c.promoted ? '#22c55e' : 'text.disabled' }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
