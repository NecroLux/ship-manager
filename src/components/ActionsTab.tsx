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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Tooltip,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSheetData } from '../context/SheetDataContext';
import {
  parseAllCrewMembers,
  parseAllLeaderboardEntries,
  enrichCrewWithLeaderboardData,
  getResponsibleStaff as getResponsibleStaffFromParser,
} from '../services/dataParser';
import { useState, useMemo, useCallback } from 'react';

interface ActionItem {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low' | 'recurring';
  sailor: string;
  squad: string;
  responsible: string;
  description: string;
  details: string;
  isRecurring?: boolean;
  cadence?: 'daily' | 'weekly' | 'fortnightly';
}

// ==================== RECURRING SQUAD LEADER TASKS ====================
interface RecurringTask {
  id: string;
  description: string;
  details: string;
  cadence: 'daily' | 'weekly' | 'fortnightly';
  severity: 'high' | 'medium' | 'low';
}

const RECURRING_SL_TASKS: RecurringTask[] = [
  { id: 'sl-qotd', description: 'Question of the Day', details: 'Post a question of the day in your squad channel to encourage engagement.', cadence: 'daily', severity: 'low' },
  { id: 'sl-checkin', description: 'Check-in Squad Chat', details: 'Review squad chat activity and respond to any outstanding messages or concerns.', cadence: 'daily', severity: 'low' },
  { id: 'sl-report', description: 'Run Member Report', details: 'Review member compliance and activity. Flag any issues to Command.', cadence: 'weekly', severity: 'medium' },
  { id: 'sl-loa-check', description: 'Check on LOA Members', details: 'Check on LOA members expected to return. Follow up and update status as needed.', cadence: 'weekly', severity: 'medium' },
  { id: 'sl-squad-report', description: 'Update Squad Report', details: 'Update the squad report with current member status, compliance, and any concerns for Command review.', cadence: 'fortnightly', severity: 'high' },
];

// Cadence → milliseconds
const CADENCE_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  fortnightly: 14 * 24 * 60 * 60 * 1000,
};

const CADENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
};

// Load/save completed timestamps from localStorage
const getCompletedTasks = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem('sl-recurring-tasks') || '{}');
  } catch { return {}; }
};

const saveCompletedTask = (taskId: string) => {
  const completed = getCompletedTasks();
  completed[taskId] = Date.now();
  localStorage.setItem('sl-recurring-tasks', JSON.stringify(completed));
};

// Check if a recurring task is currently due (not completed within its cadence window)
const isTaskDue = (task: RecurringTask): boolean => {
  const completed = getCompletedTasks();
  const lastCompleted = completed[task.id];
  if (!lastCompleted) return true;
  return Date.now() - lastCompleted >= CADENCE_MS[task.cadence];
};

// Get time remaining until task is due again (for display)
const getNextDue = (task: RecurringTask): string => {
  const completed = getCompletedTasks();
  const lastCompleted = completed[task.id];
  if (!lastCompleted) return 'Now';
  const nextDue = lastCompleted + CADENCE_MS[task.cadence];
  const remaining = nextDue - Date.now();
  if (remaining <= 0) return 'Now';
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export const ActionsTab = () => {
  const { data, loading, refreshData } = useSheetData();
  const [activeTab, setActiveTab] = useState<'all' | 'co' | 'firstofficer' | 'cos' | 'squadleader1' | 'squadleader2'>('all');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recurringTick, setRecurringTick] = useState(0); // Force re-render on check-off

  // Handle checking off a recurring task
  const handleCompleteRecurring = useCallback((taskId: string) => {
    saveCompletedTask(taskId);
    setRecurringTick((t) => t + 1);
  }, []);

  // Detect crew actions using the same enriched data pipeline as Crew tab
  const detectedActions = useMemo(() => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return [];

    const actions: ActionItem[] = [];
    let actionId = 0;

    // === STEP 1: Parse crew from Gullinbursti (source of truth) ===
    const crew = parseAllCrewMembers(data.gullinbursti.rows);

    // === STEP 2: Parse leaderboard data from Voyage Awards ===
    const leaderboardData = data.voyageAwards?.rows
      ? parseAllLeaderboardEntries(data.voyageAwards.rows)
      : [];

    // === STEP 3: Enrich crew with leaderboard data (same as Crew tab) ===
    const enrichedCrew = crew.map((m) => enrichCrewWithLeaderboardData(m, leaderboardData));

    const now = new Date();

    enrichedCrew.forEach((member) => {
      // Skip LOA members — they are exempt from all requirements
      if (member.loaStatus) return;

      // --- SAILING COMPLIANCE (Gullinbursti = source of truth) ---
      if (!member.sailingCompliant) {
        // Not compliant — determine severity from leaderboard thresholds
        let severity: 'high' | 'medium' = 'medium'; // default = Attention
        let daysDetail = '';

        if (member.lastVoyageDate) {
          const lastVoyage = new Date(member.lastVoyageDate);
          if (!isNaN(lastVoyage.getTime())) {
            const days = Math.floor((now.getTime() - lastVoyage.getTime()) / (1000 * 60 * 60 * 24));
            if (days >= 30) severity = 'high';
            daysDetail = ` (${days} days since last voyage)`;
          }
        } else if (member.daysInactive >= 30) {
          severity = 'high';
          daysDetail = ` (${member.daysInactive} days inactive)`;
        } else if (member.daysInactive > 0) {
          daysDetail = ` (${member.daysInactive} days inactive)`;
        }

        actions.push({
          id: String(actionId++),
          type: 'sailing-noncompliant',
          severity,
          sailor: member.name,
          squad: member.squad,
          responsible: getResponsibleStaffFromParser('sailing-issue', member.squad),
          description: severity === 'high' ? 'Sailing: Requires Action' : 'Sailing: Requires Attention',
          details: `${member.name} is not within sailing regulations${daysDetail}. Review and encourage participation.`,
        });
      }

      // --- HOSTING COMPLIANCE (JPO+ only) ---
      if (member.canHostRank && !member.hostingCompliant) {
        let severity: 'high' | 'medium' = 'medium';
        let daysDetail = '';

        if (member.lastHostDate) {
          const lastHost = new Date(member.lastHostDate);
          if (!isNaN(lastHost.getTime())) {
            const days = Math.floor((now.getTime() - lastHost.getTime()) / (1000 * 60 * 60 * 24));
            if (days >= 14) severity = 'high';
            daysDetail = ` (${days} days since last host)`;
          }
        }

        actions.push({
          id: String(actionId++),
          type: 'hosting-noncompliant',
          severity,
          sailor: member.name,
          squad: member.squad,
          responsible: getResponsibleStaffFromParser('hosting-issue', member.squad),
          description: severity === 'high' ? 'Hosting: Requires Action' : 'Hosting: Requires Attention',
          details: `${member.name} (${member.rank}) is eligible to host but not within hosting regulations${daysDetail}.`,
        });
      }

      // --- NO CHAT ACTIVITY ---
      if (member.chatActivity === 0) {
        actions.push({
          id: String(actionId++),
          type: 'no-chat-activity',
          severity: 'low',
          sailor: member.name,
          squad: member.squad,
          responsible: getResponsibleStaffFromParser('no-chat-activity', member.squad),
          description: 'No Chat Activity',
          details: `${member.name} has no recorded chat activity. Encourage participation in squad channels.`,
        });
      }
    });

    // === STEP 4: Recurring Squad Leader tasks ===
    // Only show tasks that are currently due (not completed within their cadence)
    RECURRING_SL_TASKS.forEach((task) => {
      if (isTaskDue(task)) {
        // Add one per squad
        const squads = enrichedCrew.reduce((acc, m) => {
          if (m.squad !== 'Command Staff' && m.squad !== 'Unassigned' && !acc.includes(m.squad)) acc.push(m.squad);
          return acc;
        }, [] as string[]);

        squads.forEach((squad) => {
          actions.push({
            id: `${task.id}-${squad}`,
            type: 'recurring-sl',
            severity: task.severity,
            sailor: '—',
            squad,
            responsible: `${squad} Squad Leader`,
            description: `${task.description}`,
            details: `${task.details}\n\nCadence: ${CADENCE_LABELS[task.cadence]} · Next due: ${getNextDue(task)}`,
            isRecurring: true,
            cadence: task.cadence,
          });
        });
      }
    });

    // Sort by priority (high > medium > low > recurring)
    actions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2, recurring: 3 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });
    return actions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.gullinbursti, data.voyageAwards, recurringTick]);

  // Filter actions by responsibility
  const filteredActions = useMemo(() => {
    switch (activeTab) {
      case 'co':
        return detectedActions.filter(a => a.responsible === 'Commanding Officer (Hoit)' || a.responsible === 'Command');
      case 'firstofficer':
        return detectedActions.filter(a => a.responsible === 'First Officer (LadyHoit)' || a.responsible === 'First Officer');
      case 'cos':
        return detectedActions.filter(a => a.responsible === 'Chief of Ship (Spice)' || a.responsible.includes('Chief of Ship'));
      case 'squadleader1':
        return detectedActions.filter(a => a.responsible.includes('Necro') || (a.responsible.includes('Squad Leader') && a.squad === 'Squad 1'));
      case 'squadleader2':
        return detectedActions.filter(a => a.responsible.includes('Shade') || (a.responsible.includes('Squad Leader') && a.squad === 'Squad 2'));
      default:
        return detectedActions;
    }
  }, [detectedActions, activeTab]);

  // Count by responsibility
  const counts = useMemo(() => {
    return {
      all: detectedActions.length,
      co: detectedActions.filter(a => a.responsible === 'Commanding Officer (Hoit)' || a.responsible === 'Command').length,
      firstofficer: detectedActions.filter(a => a.responsible === 'First Officer (LadyHoit)' || a.responsible === 'First Officer').length,
      cos: detectedActions.filter(a => a.responsible === 'Chief of Ship (Spice)' || a.responsible.includes('Chief of Ship')).length,
      squadleader1: detectedActions.filter(a => a.responsible.includes('Necro') || (a.responsible.includes('Squad Leader') && a.squad === 'Squad 1')).length,
      squadleader2: detectedActions.filter(a => a.responsible.includes('Shade') || (a.responsible.includes('Squad Leader') && a.squad === 'Squad 2')).length,
    };
  }, [detectedActions]);

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon sx={{ color: '#dc2626' }} />;
      case 'medium':
        return <WarningIcon sx={{ color: '#eab308' }} />;
      case 'low':
        return <WarningIcon sx={{ color: '#3b82f6' }} />;
      case 'recurring':
        return <WarningIcon sx={{ color: '#3b82f6' }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header with Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Priority Tabs with Refresh Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_e, newValue) => setActiveTab(newValue as any)}
              sx={{ flex: 1 }}
            >
              <Tab label={`All (${counts.all})`} value="all" />
              <Tab label={`CO (${counts.co})`} value="co" />
              <Tab label={`FO (${counts.firstofficer})`} value="firstofficer" />
              <Tab label={`COS (${counts.cos})`} value="cos" />
              <Tab label={`SL1 (${counts.squadleader1})`} value="squadleader1" />
              <Tab label={`SL2 (${counts.squadleader2})`} value="squadleader2" />
            </Tabs>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
              sx={{ ml: 2, flexShrink: 0 }}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Actions Table - Grouped by Priority */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {(() => {
          // Group filtered actions by severity
          const groups: Record<string, typeof filteredActions> = {};
          const severityLabels: Record<string, { label: string; color: string; bgColor: string }> = {
            high: { label: '🔴 High Priority', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.08)' },
            medium: { label: '🟡 Medium Priority', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.08)' },
            low: { label: '🔵 Low Priority', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.08)' },
            recurring: { label: '🔁 Recurring', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.08)' },
          };
          const severityOrder = ['high', 'medium', 'low', 'recurring'];

          filteredActions.forEach((action) => {
            const sev = action.severity || 'low';
            if (!groups[sev]) groups[sev] = [];
            groups[sev].push(action);
          });

          if (filteredActions.length === 0) {
            return (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No action items for this category
                </Typography>
              </Paper>
            );
          }

          return severityOrder.map((sev) => {
            const items = groups[sev];
            if (!items || items.length === 0) return null;
            const meta = severityLabels[sev];

            return (
              <Paper key={sev} sx={{ overflow: 'hidden', border: `1px solid ${meta.color}22` }}>
                <Box sx={{ px: 2, py: 1.5, backgroundColor: meta.bgColor, borderBottom: `2px solid ${meta.color}33` }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: meta.color }}>
                    {meta.label} ({items.length})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '5%', textAlign: 'center' }}></TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Sailor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '18%' }}>Responsible</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '12%', textAlign: 'center' }}>Squad</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '10%', textAlign: 'center' }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '10%', textAlign: 'center' }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((action) => (
                        <TableRow key={action.id} hover>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {getSeverityIcon(action.severity)}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {action.description}
                              </Typography>
                              {action.isRecurring && action.cadence && (
                                <Chip
                                  label={CADENCE_LABELS[action.cadence]}
                                  size="small"
                                  sx={{ fontSize: '0.65rem', height: 18, color: '#8b5cf6', borderColor: '#8b5cf633' }}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2">{action.sailor}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                              {action.responsible}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <Chip label={action.squad} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <Chip
                              label={action.severity.charAt(0).toUpperCase() + action.severity.slice(1)}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                color: meta.color,
                                borderColor: meta.color,
                                backgroundColor: meta.bgColor,
                              }}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            {action.isRecurring ? (
                              <Tooltip title="Mark as done — will reappear when next due">
                                <Checkbox
                                  size="small"
                                  checked={false}
                                  onChange={() => {
                                    // Extract the base task id (remove squad suffix)
                                    const baseId = action.id.replace(/-[^-]+$/, '') + '-' + action.id.split('-').pop();
                                    const taskId = RECURRING_SL_TASKS.find(t => action.id.startsWith(t.id))?.id || baseId;
                                    handleCompleteRecurring(taskId);
                                  }}
                                  sx={{ color: '#22c55e', '&.Mui-checked': { color: '#22c55e' } }}
                                />
                              </Tooltip>
                            ) : (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                  setSelectedAction(action);
                                  setDetailsOpen(true);
                                }}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          });
        })()}
      </Box>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            {selectedAction && getSeverityIcon(selectedAction.severity)}
            <Typography variant="h6">
              {selectedAction?.description}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Sailor
              </Typography>
              <Typography variant="body1">{selectedAction?.sailor}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Responsible For Action
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                {selectedAction?.responsible}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Squad
              </Typography>
              <Typography variant="body1">{selectedAction?.squad}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Details
              </Typography>
              <Typography variant="body2">{selectedAction?.details}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
