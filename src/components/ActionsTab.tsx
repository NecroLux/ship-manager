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
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSheetData } from '../context/SheetDataContext';
import { useState, useMemo } from 'react';

interface ActionItem {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  sailor: string;
  squad: string;
  responsible: string; // Who should handle this (squad leader, COS, etc.)
  description: string;
  details: string;
}

// Determine who should handle each action based on type and criteria
const getResponsibleStaff = (actionType: string, squad: string): string => {
  // HIGH PRIORITY actions go to Command/COS
  if (
    actionType === 'compliance-issue' ||
    actionType === 'sailing-issue' ||
    actionType === 'hosting-issue'
  ) {
    return 'Chief of Ship / Command';
  }

  // AWARDS/SUBCLASS go to First Officer
  if (actionType === 'award-eligible' || actionType === 'subclass-ready') {
    return 'First Officer';
  }

  // Chat activity goes to Squad Leaders
  if (
    actionType === 'no-chat-activity' ||
    actionType === 'low-chat-activity'
  ) {
    return `${squad} Squad Leader`;
  }

  return 'Command';
};

export const ActionsTab = () => {
  const { data, loading, refreshData } = useSheetData();
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Detect crew actions based on naval rules
  const detectedActions = useMemo(() => {
    if (!data.gullinbursti || data.gullinbursti.rows.length === 0) return [];

    const actions: ActionItem[] = [];
    let actionId = 0;
    const headers = data.gullinbursti.headers;

    console.log('=== ACTION DETECTION DEBUG ===');
    console.log('Headers:', headers);
    console.log('First 3 rows:', data.gullinbursti.rows.slice(0, 3));

    let currentSquad = 'Command Staff'; // Start with Command Staff as default

    data.gullinbursti.rows.forEach((row, rowIdx) => {
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

      if (rowIdx < 5) {
        console.log(`Row ${rowIdx}: ${name} (${rank}, Squad: "${assignedSquad}", Compliance: "${compliance}", Stars: ${stars}, Raw: "${starsRaw}")`);
      }

      // ONLY flag "No Chat Activity" if stars = 0 AND compliance is not on LOA/Leave
      // This prevents false positives for people on legitimate leave
      const complianceLower = compliance.toLowerCase().trim();
      const isOnLeave = complianceLower.includes('loa') || 
                        complianceLower.includes('leave') || 
                        complianceLower.includes('off-duty');
      
      if (stars === 0 && !isOnLeave) {
        console.log(`  -> ACTION: No Chat Activity (stars=${stars})`);
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
          console.log(`  -> ACTION: Compliance Issue (${compliance})`);
          let complianceType = '';
          if (complianceLower === 'inactive') {
            complianceType = 'Inactive';
          } else if (complianceLower === 'flagged') {
            complianceType = 'Flagged';
          } else if (complianceLower === 'no') {
            complianceType = 'Non-Compliant';
          } else {
            complianceType = compliance;
          }

          actions.push({
            id: String(actionId++),
            type: 'compliance-issue',
            severity: 'high',
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
        console.log(`  -> ACTION: Sailing Issue (${sailingStatus})`);
        actions.push({
          id: String(actionId++),
          type: 'sailing-issue',
          severity: 'high',
          sailor: name,
          squad: assignedSquad,
          responsible: getResponsibleStaff('sailing-issue', assignedSquad),
          description: 'Sailing Issue',
          details: `${name} has a sailing/voyage issue that needs attention. Review and provide guidance.`,
        });
      }

      if (hostingLower.includes('requires') || hostingLower.includes('attention')) {
        console.log(`  -> ACTION: Hosting Issue (${hostingStatus})`);
        actions.push({
          id: String(actionId++),
          type: 'hosting-issue',
          severity: 'high',
          sailor: name,
          squad: assignedSquad,
          responsible: getResponsibleStaff('hosting-issue', assignedSquad),
          description: 'Hosting Issue',
          details: `${name} has a hosting issue that needs attention. Review and provide guidance.`,
        });
      }
    });

    console.log('Total actions detected:', actions.length);
    console.log('=== END DEBUG ===');
    // Sort by severity (high > medium > low)
    actions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    return actions;
  }, [data.gullinbursti]);

  // Filter actions by severity
  const filteredActions = useMemo(() => {
    switch (activeTab) {
      case 'high':
        return detectedActions.filter(a => a.severity === 'high');
      case 'medium':
        return detectedActions.filter(a => a.severity === 'medium');
      case 'low':
        return detectedActions.filter(a => a.severity === 'low');
      default:
        return detectedActions;
    }
  }, [detectedActions, activeTab]);

  // Count by severity
  const counts = useMemo(() => {
    return {
      all: detectedActions.length,
      high: detectedActions.filter(a => a.severity === 'high').length,
      medium: detectedActions.filter(a => a.severity === 'medium').length,
      low: detectedActions.filter(a => a.severity === 'low').length,
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
        return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case 'medium':
        return <WarningIcon sx={{ color: '#f57c00' }} />;
      case 'low':
        return <InfoIcon sx={{ color: '#1976d2' }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Crew Action Items
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Intelligent detection of crew concerns requiring attention
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {/* Priority Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_e, newValue) => setActiveTab(newValue)}
            >
              <Tab label={`All Actions (${counts.all})`} value="all" />
              <Tab label={`High Priority (${counts.high})`} value="high" />
              <Tab label={`Medium Priority (${counts.medium})`} value="medium" />
              <Tab label={`Low Priority (${counts.low})`} value="low" />
            </Tabs>
          </Box>

          {/* Summary Stats */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, flex: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="textSecondary">
                High Severity
              </Typography>
              <Typography variant="h6" sx={{ color: '#d32f2f' }}>
                {counts.high}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="textSecondary">
                Medium Severity
              </Typography>
              <Typography variant="h6" sx={{ color: '#f57c00' }}>
                {counts.medium}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="textSecondary">
                Low Severity
              </Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {counts.low}
              </Typography>
            </Paper>
          </Stack>
        </CardContent>
      </Card>

      {/* Actions Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Sailor</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Responsible</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Squad</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Squad</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActions.length > 0 ? (
                filteredActions.map((action) => (
                  <TableRow key={action.id} hover>
                    <TableCell align="center">
                      {getSeverityIcon(action.severity)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {action.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{action.sailor}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                        {action.responsible}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={action.squad} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          setSelectedAction(action);
                          setDetailsOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No action items for this priority level
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Info Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Action Categories
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ErrorIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  High Priority
                </Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                No chat activity or compliance issues (LOA/Inactive) requiring immediate attention
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <WarningIcon sx={{ color: '#f57c00', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Medium Priority
                </Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Low chat activity or missing recommended ribbons
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <InfoIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Low Priority
                </Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Informational items or crew development opportunities
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

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
