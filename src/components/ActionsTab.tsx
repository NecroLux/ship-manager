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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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
  isManual?: boolean;
}

// ==================== RESPONSIBLE NAME MAPPING ====================
const RESPONSIBLE_OPTIONS = [
  { name: 'Hoit', role: 'CO' },
  { name: 'LadyHoit', role: 'FO' },
  { name: 'Spice', role: 'CoS' },
  { name: 'Necro', role: 'SL1' },
  { name: 'Shade', role: 'SL2' },
];

// Map squad name to SL name
const getSquadLeaderName = (squad: string): string => {
  const sqLower = squad.toLowerCase();
  if (sqLower.includes('necro')) return 'Necro';
  if (sqLower.includes('shade')) return 'Shade';
  return squad;
};

// ==================== MANUAL ACTIONS (localStorage) ====================
interface ManualAction {
  id: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  sailor: string;
  responsible: string;
  cadence: '' | 'daily' | 'weekly' | 'fortnightly';
}

const getManualActions = (): ManualAction[] => {
  try { return JSON.parse(localStorage.getItem('manual-actions') || '[]'); } catch { return []; }
};
const saveManualActions = (actions: ManualAction[]) => {
  localStorage.setItem('manual-actions', JSON.stringify(actions));
};
const deleteManualAction = (id: string) => {
  const actions = getManualActions().filter(a => a.id !== id);
  saveManualActions(actions);
};

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
  const [recurringTick, setRecurringTick] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manualTick, setManualTick] = useState(0);

  // New action form state
  const [newAction, setNewAction] = useState({ description: '', severity: 'medium' as 'high' | 'medium' | 'low', sailor: '', responsible: 'Necro', cadence: '' as '' | 'daily' | 'weekly' | 'fortnightly' });

  const handleCompleteRecurring = useCallback((taskId: string) => {
    saveCompletedTask(taskId);
    setRecurringTick((t) => t + 1);
  }, []);

  const handleAddAction = useCallback(() => {
    if (!newAction.description.trim()) return;
    const actions = getManualActions();
    actions.push({ ...newAction, id: `manual-${Date.now()}` });
    saveManualActions(actions);
    setNewAction({ description: '', severity: 'medium', sailor: '', responsible: 'Necro', cadence: '' });
    setAddDialogOpen(false);
    setManualTick((t) => t + 1);
  }, [newAction]);

  const handleDeleteManual = useCallback((id: string) => {
    deleteManualAction(id);
    setManualTick((t) => t + 1);
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
            responsible: getSquadLeaderName(squad),
            description: `${task.description}`,
            details: `${task.details}\n\nCadence: ${CADENCE_LABELS[task.cadence]} · Next due: ${getNextDue(task)}`,
            isRecurring: true,
            cadence: task.cadence,
          });
        });
      }
    });

    // === STEP 5: Manual actions from localStorage ===
    const manualActions = getManualActions();
    manualActions.forEach((ma) => {
      // Determine squad from responsible name for filtering
      let squad = 'Command Staff';
      if (ma.responsible === 'Necro') squad = 'Necro Squad';
      else if (ma.responsible === 'Shade') squad = 'Shade Squad';

      actions.push({
        id: ma.id,
        type: 'manual',
        severity: ma.severity,
        sailor: ma.sailor || '—',
        squad,
        responsible: ma.responsible,
        description: ma.description,
        details: ma.cadence ? `Frequency: ${CADENCE_LABELS[ma.cadence]}` : 'One-time action',
        isManual: true,
        isRecurring: !!ma.cadence,
        cadence: ma.cadence || undefined,
      });
    });

    // Sort by priority (high > medium > low), then recurring before non-recurring
    actions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2, recurring: 3 };
      const sevDiff = severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      if (sevDiff !== 0) return sevDiff;
      // Within same severity: recurring/manual tasks first, then data-driven
      const aRecurring = a.isRecurring || a.isManual ? 0 : 1;
      const bRecurring = b.isRecurring || b.isManual ? 0 : 1;
      return aRecurring - bRecurring;
    });
    return actions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.gullinbursti, data.voyageAwards, recurringTick, manualTick]);

  // Filter actions by responsibility (using names)
  const filteredActions = useMemo(() => {
    switch (activeTab) {
      case 'co':
        return detectedActions.filter(a => a.responsible === 'Hoit');
      case 'firstofficer':
        return detectedActions.filter(a => a.responsible === 'LadyHoit');
      case 'cos':
        return detectedActions.filter(a => a.responsible === 'Spice');
      case 'squadleader1':
        return detectedActions.filter(a => a.responsible === 'Necro');
      case 'squadleader2':
        return detectedActions.filter(a => a.responsible === 'Shade');
      default:
        return detectedActions;
    }
  }, [detectedActions, activeTab]);

  // Count by responsibility
  const counts = useMemo(() => {
    return {
      all: detectedActions.length,
      co: detectedActions.filter(a => a.responsible === 'Hoit').length,
      firstofficer: detectedActions.filter(a => a.responsible === 'LadyHoit').length,
      cos: detectedActions.filter(a => a.responsible === 'Spice').length,
      squadleader1: detectedActions.filter(a => a.responsible === 'Necro').length,
      squadleader2: detectedActions.filter(a => a.responsible === 'Shade').length,
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
    const circleStyle = (bgColor: string) => ({
      width: 24, height: 24, borderRadius: '50%', backgroundColor: bgColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    switch (severity) {
      case 'high':
        return <Box sx={circleStyle('#dc2626')}><Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', lineHeight: 1 }}>1</Typography></Box>;
      case 'medium':
        return <Box sx={circleStyle('#f97316')}><Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', lineHeight: 1 }}>2</Typography></Box>;
      case 'low':
        return <Box sx={circleStyle('#eab308')}><Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', lineHeight: 1 }}>3</Typography></Box>;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header with Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Priority Tabs with Refresh + Add Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_e, newValue) => setActiveTab(newValue as any)}
              sx={{ flex: 1 }}
            >
              <Tab label={`All (${counts.all})`} value="all" />
              <Tab label={`CO (${counts.co})`} value="co" />
              <Tab label={`FO (${counts.firstofficer})`} value="firstofficer" />
              <Tab label={`CoS (${counts.cos})`} value="cos" />
              <Tab label={`SL1 (${counts.squadleader1})`} value="squadleader1" />
              <Tab label={`SL2 (${counts.squadleader2})`} value="squadleader2" />
            </Tabs>
            <Stack direction="row" spacing={1} sx={{ ml: 2, flexShrink: 0 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                color="success"
              >
                Add
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={refreshData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Actions Table - Grouped by Priority */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {(() => {
          const groups: Record<string, typeof filteredActions> = {};
          const severityLabels: Record<string, { label: string; color: string; bgColor: string }> = {
            high: { label: '🔴 High Priority', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.08)' },
            medium: { label: '🟡 Medium Priority', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.08)' },
            low: { label: '🔵 Low Priority', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.08)' },
          };
          const severityOrder = ['high', 'medium', 'low'];

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
                        <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Sailor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Responsible</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '12%', textAlign: 'center' }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '13%', textAlign: 'center' }}></TableCell>
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
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                              {action.responsible}
                            </Typography>
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
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              {action.isRecurring && (
                                <Tooltip title="Mark as done — will reappear when next due">
                                  <Checkbox
                                    size="small"
                                    checked={false}
                                    onChange={() => {
                                      const taskId = RECURRING_SL_TASKS.find(t => action.id.startsWith(t.id))?.id;
                                      if (taskId) handleCompleteRecurring(taskId);
                                    }}
                                    sx={{ color: '#22c55e', '&.Mui-checked': { color: '#22c55e' }, p: 0.5 }}
                                  />
                                </Tooltip>
                              )}
                              {action.isManual && (
                                <Tooltip title="Delete this action">
                                  <IconButton size="small" onClick={() => handleDeleteManual(action.id)} sx={{ color: '#ef4444' }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {!action.isRecurring && !action.isManual && (
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => { setSelectedAction(action); setDetailsOpen(true); }}
                                >
                                  View
                                </Button>
                              )}
                            </Stack>
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
            <Typography variant="h6">{selectedAction?.description}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Sailor</Typography>
              <Typography variant="body1">{selectedAction?.sailor}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Responsible</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>{selectedAction?.responsible}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Details</Typography>
              <Typography variant="body2">{selectedAction?.details}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Action Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Action</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Action Name"
              fullWidth
              size="small"
              value={newAction.description}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={newAction.severity}
                label="Priority"
                onChange={(e) => setNewAction({ ...newAction, severity: e.target.value as any })}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="User (if applicable)"
              fullWidth
              size="small"
              value={newAction.sailor}
              onChange={(e) => setNewAction({ ...newAction, sailor: e.target.value })}
              placeholder="Leave blank if not user-specific"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Responsible</InputLabel>
              <Select
                value={newAction.responsible}
                label="Responsible"
                onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })}
              >
                {RESPONSIBLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.name} value={opt.name}>{opt.name} ({opt.role})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Frequency</InputLabel>
              <Select
                value={newAction.cadence}
                label="Frequency"
                onChange={(e) => setNewAction({ ...newAction, cadence: e.target.value as any })}
              >
                <MenuItem value="">One-time</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="fortnightly">Fortnightly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAction} disabled={!newAction.description.trim()}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
