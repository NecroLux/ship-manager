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
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSheetData } from '../context/SheetDataContext';
import { parseAllCrewMembers, parseStaffComments, getResponsibleStaff as getResponsibleStaffFromParser } from '../services/dataParser';
import { useState, useMemo } from 'react';

interface ActionItem {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low' | 'recurring';
  sailor: string;
  squad: string;
  responsible: string; // Who should handle this (squad leader, COS, etc.)
  description: string;
  details: string;
}

// Determine who should handle each action based on type and criteria
const getResponsibleStaff = (actionType: string, squad: string): string => {
  return getResponsibleStaffFromParser(actionType, squad);
};

export const ActionsTab = () => {
  const { data, loading, refreshData } = useSheetData();
  const [activeTab, setActiveTab] = useState<'all' | 'co' | 'firstofficer' | 'cos' | 'squadleader1' | 'squadleader2'>('all');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Detect crew actions based on naval rules
  const detectedActions = useMemo(() => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return [];

    const actions: ActionItem[] = [];
    let actionId = 0;
    const headers = data.gullinbursti.headers;

  // Action detection debug logs removed for production

    let currentSquad = 'Command Staff'; // Start with Command Staff as default

  data.gullinbursti.rows.forEach((row) => {
      // Extract crew data from row using headers
      const rank = (row[headers[0]] || '').trim();
      const name = (row[headers[1]] || '').trim();
      
      // Try to find squad column by header name, fallback to index 3
      let squadFromRow = '';
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().includes('squad')) {
          squadFromRow = (row[headers[i]] || '').trim();
          break;
        }
      }
      
      // If no squad column found by name, try index 3 but validate it's not a boolean
      if (!squadFromRow && row[headers[3]]) {
        const val = (row[headers[3]] || '').trim();
        if (val && val.toLowerCase() !== 'true' && val.toLowerCase() !== 'false') {
          squadFromRow = val;
        }
      }

      // Find compliance column
      let compliance = '';
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().includes('compliance')) {
          compliance = (row[headers[i]] || '').trim();
          break;
        }
      }
      
      // Find chat activity/stars column
      let starsRaw = '';
      for (let i = 0; i < headers.length; i++) {
        const headerLower = headers[i].toLowerCase();
        if (headerLower.includes('chat') || headerLower.includes('activity') || headerLower.includes('star')) {
          starsRaw = (row[headers[i]] || '').trim();
          break;
        }
      }
      
      // Skip column header row
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

      // Use squad from row if available, otherwise use currentSquad
      const assignedSquad = squadFromRow || currentSquad;

      // Parse stars - count actual stars (★ characters)
      let stars = 0;
      if (starsRaw) {
        // Count star characters (★ or *)
        const starCount = (starsRaw.match(/[★*]/g) || []).length;
        // If that doesn't work, try to extract a number
        if (starCount === 0) {
          const starMatch = starsRaw.match(/\d+/);
          if (starMatch) {
            stars = parseInt(starMatch[0], 10);
          }
        } else {
          stars = starCount;
        }
      }

      // per-row debug logging removed

      // ONLY flag "No Chat Activity" if stars = 0 AND compliance is not on LOA/Leave
      // This prevents false positives for people on legitimate leave
      const complianceLower = compliance.toLowerCase().trim();
      const isOnLeave = complianceLower.includes('loa') || 
                        complianceLower.includes('leave') || 
                        complianceLower.includes('off-duty');
      
      if (stars === 0 && !isOnLeave) {
        actions.push({
          id: String(actionId++),
          type: 'no-chat-activity',
          severity: 'low',
          sailor: name,
          squad: assignedSquad,
          responsible: getResponsibleStaff('no-chat-activity', assignedSquad),
          description: 'No Chat Activity',
          details: `${name} has not participated in chat. Encourage participation in squad channels.`,
        });
      }

      // COMPLIANCE_ISSUE - Only flag serious compliance issues
      // Don't flag: Empty cells, "Active", or temporary LOA statuses
      if (compliance) {
        // Only flag specific problematic statuses
        const shouldFlag = 
          complianceLower === 'inactive' || 
          complianceLower === 'flagged' || 
          complianceLower === 'no' ||
          complianceLower === 'non-compliant' ||
          complianceLower === 'requires action';
        
        if (shouldFlag) {
          let complianceType = '';
          let priority: 'high' | 'medium' | 'low' | 'recurring' = 'high';
          
          if (complianceLower === 'inactive') {
            complianceType = 'Inactive';
            priority = 'medium'; // Requires attention
          } else if (complianceLower === 'flagged') {
            complianceType = 'Flagged';
            priority = 'high'; // Requires action
          } else if (complianceLower === 'no') {
            complianceType = 'Non-Compliant';
            priority = 'high'; // Requires action
          } else if (complianceLower === 'requires action') {
            complianceType = 'Requires Action';
            priority = 'high'; // Requires action
          } else {
            complianceType = compliance;
            priority = 'medium';
          }

          actions.push({
            id: String(actionId++),
            type: 'compliance-issue',
            severity: priority,
            sailor: name,
            squad: assignedSquad,
            responsible: getResponsibleStaff('compliance-issue', assignedSquad),
            description: `Compliance: ${complianceType}`,
            details: `${name} is marked as ${complianceType}. Review status and take appropriate action.`,
          });
        }
      }

      // SAILING/HOSTING ISSUES - Check if they should be sailing/hosting but aren't
      // Look for "Requires attention" or similar indicators in Sailing and Hosting columns
      // These are typically columns after the stars column
      let sailingStatus = '';
      let hostingStatus = '';
      
      // Search through row for Sailing and Hosting columns
      Object.entries(row).forEach(([colKey, colValue]) => {
        const keyLower = colKey.toLowerCase();
        if (keyLower.includes('sailing') || keyLower.includes('voyage')) {
          sailingStatus = (colValue || '').trim();
        }
        if (keyLower.includes('hosting') || keyLower.includes('host')) {
          hostingStatus = (colValue || '').trim();
        }
      });

      // Flag if sailing or hosting "Requires attention"
      const sailingLower = sailingStatus.toLowerCase();
      const hostingLower = hostingStatus.toLowerCase();

      if (sailingLower.includes('requires') || sailingLower.includes('attention')) {
        const priority = sailingLower.includes('requires action') ? 'high' : 'medium';
        actions.push({
          id: String(actionId++),
          type: 'sailing-issue',
          severity: priority,
          sailor: name,
          squad: assignedSquad,
          responsible: getResponsibleStaff('sailing-issue', assignedSquad),
          description: 'Sailing Issue',
          details: `${name} has a sailing/voyage issue that needs attention. Review and provide guidance.`,
        });
      }

      if (hostingLower.includes('requires') || hostingLower.includes('attention')) {
        const priority = hostingLower.includes('requires action') ? 'high' : 'medium';
        actions.push({
          id: String(actionId++),
          type: 'hosting-issue',
          severity: priority,
          sailor: name,
          squad: assignedSquad,
          responsible: getResponsibleStaff('hosting-issue', assignedSquad),
          description: 'Hosting Issue',
          details: `${name} has a hosting issue that needs attention. Review and provide guidance.`,
        });
      }
    });

  // Total actions detected: actions.length
    
  // ADD: Parse staff comments for additional actions
  const crew = parseAllCrewMembers(data.gullinbursti.rows);
  const commentActions = parseStaffComments(crew, actions.length);
  
  // Convert staff comment actions to ActionItem format
  commentActions.forEach((action) => {
    actions.push({
      id: action.id,
      type: action.type,
      severity: action.severity as 'high' | 'medium' | 'low' | 'recurring',
      sailor: action.sailor,
      squad: action.squad,
      responsible: action.responsible,
      description: action.description,
      details: action.details + (action.deadline ? `\n\nDeadline: ${action.deadline}` : ''),
    });
  });

    // Sort by priority (high > medium > low > recurring)
    actions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2, recurring: 3 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });
    return actions;
  }, [data.gullinbursti]);

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
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {action.description}
                            </Typography>
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
