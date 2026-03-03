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
  LinearProgress,
} from '@mui/material';
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

type FilterTab = 'all' | 'co' | 'fo' | 'cos' | 'sl1' | 'sl2' | 'boa' | 'ref';

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
  sailorName: string,
  commandStaff: { co: string | null; fo: string | null; cos: string | null; sls: Record<string, string> }
): string => {
  // Chain of command for escalation: SL → CoS → FO → CO → BOA
  const chain = [
    commandStaff.sls[squad] || null,
    commandStaff.cos,
    commandStaff.fo,
    commandStaff.co,
  ].filter(Boolean) as string[];

  const escalate = (person: string): string => {
    if (person.toLowerCase() !== sailorName.toLowerCase()) return person;
    // Person can't award themselves — find next up in chain
    const idx = chain.findIndex((p) => p.toLowerCase() === person.toLowerCase());
    for (let i = idx + 1; i < chain.length; i++) {
      if (chain[i].toLowerCase() !== sailorName.toLowerCase()) return chain[i];
    }
    return 'Board of Admiralty';
  };

  if (responsibleRank === 'SL/CoS') {
    const sl = commandStaff.sls[squad];
    if (sl) return escalate(sl);
    if (commandStaff.cos) return escalate(commandStaff.cos);
    if (commandStaff.fo) return escalate(commandStaff.fo);
    return commandStaff.co ? escalate(commandStaff.co) : 'Ship Command';
  }
  if (responsibleRank === 'CO') return commandStaff.co ? escalate(commandStaff.co) : 'Ship CO';

  if (responsibleRank === 'O-7' || responsibleRank === 'O-8' || responsibleRank === 'O-9' || responsibleRank === 'O-10' || responsibleRank === 'BOA') {
    return 'Board of Admiralty';
  }
  if (responsibleRank === 'O-4') return commandStaff.co ? escalate(commandStaff.co) : 'Ship CO';
  if (responsibleRank === 'O-1') {
    const person = commandStaff.fo || commandStaff.co;
    return person ? escalate(person) : 'Junior Officer+';
  }
  if (responsibleRank === 'E-7') {
    const person = commandStaff.cos || commandStaff.fo || commandStaff.co;
    return person ? escalate(person) : 'SNCO+';
  }
  if (responsibleRank === 'E-6') {
    const sl = commandStaff.sls[squad];
    const person = sl || commandStaff.cos || commandStaff.fo;
    return person ? escalate(person) : 'NCO+';
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
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [awardedTick, setAwardedTick] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Parse command staff for responsible-person mapping
  const commandStaff = useMemo(() => {
    const result: { co: string | null; fo: string | null; cos: string | null; sls: Record<string, string> } = {
      co: null, fo: null, cos: null, sls: {},
    };
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return result;
    const crew = parseAllCrewMembers(data.gullinbursti.rows);
    crew.forEach((m) => {
      const rL = m.rank.toLowerCase();
      const nL = m.name.toLowerCase();
      if (!result.co && (rL.includes('commander') && !rL.includes('midship') && !nL.includes('lady') && !nL.includes('spice'))) result.co = m.name;
      if (!result.fo && (nL.includes('ladyhoit') || rL.includes('midship'))) result.fo = m.name;
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
            responsible: getResponsiblePerson(award.responsibleRank, member.squad, member.name, commandStaff),
            currentValue: valueStr,
            awarded: awardedSet.has(key) || isKnownAwarded(knownSet, award.id, member.name),
          });
        }
      });

      // Also inject confirmed non-auto-detect awards from KnownAwards
      // (conduct, combat, representation, etc. that are manually awarded)
      const nonAutoAwards = AWARDS.filter((a) => !a.autoDetect);
      nonAutoAwards.forEach((award) => {
        const isKnown = isKnownAwarded(knownSet, award.id, member.name);
        const key = `${award.id}::${member.name}`;
        const isManuallyAwarded = awardedSet.has(key);
        if (isKnown || isManuallyAwarded) {
          results.push({
            award,
            sailorName: member.name,
            sailorRank: member.rank,
            squad: member.squad,
            responsible: getResponsiblePerson(award.responsibleRank, member.squad, member.name, commandStaff),
            currentValue: 'Confirmed',
            awarded: true,
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
        case 'fo': return r.includes('ladyhoit') || r.includes('lady');
        case 'cos': return r.includes('spice');
        case 'sl1': return r.includes('necro');
        case 'sl2': return r.includes('shade');
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
      fo: byPerson((r) => r.includes('ladyhoit') || r.includes('lady')),
      cos: byPerson((r) => r.includes('spice')),
      sl1: byPerson((r) => r.includes('necro')),
      sl2: byPerson((r) => r.includes('shade')),
      boa: byPerson((r) => r.includes('admiralty') || r.includes('fleet')),
    };
  }, [eligibleAwards]);

  // Per-sailor readiness: what % of their eligible awards have been awarded
  const sailorReadiness = useMemo(() => {
    const map: Record<string, { awarded: number; total: number }> = {};
    eligibleAwards.forEach((e) => {
      if (!map[e.sailorName]) map[e.sailorName] = { awarded: 0, total: 0 };
      map[e.sailorName].total++;
      if (e.awarded) map[e.sailorName].awarded++;
    });
    return map;
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Readiness</TableCell>
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
                        <TableCell sx={{ minWidth: 100 }}>
                          {(() => {
                            const sr = sailorReadiness[e.sailorName] || { awarded: 0, total: 1 };
                            const pct = Math.round((sr.awarded / sr.total) * 100);
                            const color = pct >= 100 ? '#22c55e' : pct >= 66 ? '#eab308' : pct >= 33 ? '#f97316' : '#ef4444';
                            return (
                              <Stack spacing={0.5}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color }}>
                                  {sr.awarded}/{sr.total} ({pct}%)
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    backgroundColor: 'action.disabledBackground',
                                    '& .MuiLinearProgress-bar': { backgroundColor: color },
                                  }}
                                />
                              </Stack>
                            );
                          })()}
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
