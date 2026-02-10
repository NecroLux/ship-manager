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
import { RANKS } from '../config/NavalConfig';

interface ActionItem {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  sailor: string;
  rank: string;
  squad: string;
  description: string;
  details: string;
}

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

    data.gullinbursti.rows.forEach((row, rowIdx) => {
      // Extract crew data from row using headers
      const rank = (row[headers[0]] || '').trim();
      const name = (row[headers[1]] || '').trim();
      const squad = (row[headers[3]] || '').trim();
      const compliance = (row[headers[8]] || '').trim();
      const starsRaw = (row[headers[10]] || '').trim();
      
      // Skip empty rows
      if (!rank || !name) return;

      // Parse stars (handle various formats)
      let stars = 0;
      if (starsRaw) {
        const starMatch = starsRaw.match(/\d+/);
        if (starMatch) {
          stars = parseInt(starMatch[0], 10);
        }
      }

      console.log(`Row ${rowIdx}: ${name} (${rank}, Squad: ${squad}, Compliance: "${compliance}", Stars: ${stars})`);

      // NO_CHAT_ACTIVITY - 0 stars
      if (stars === 0) {
        console.log(`  -> ACTION: No Chat Activity`);
        actions.push({
          id: String(actionId++),
          type: 'no-chat-activity',
          severity: 'high',
          sailor: name,
          rank: rank,
          squad: squad,
          description: 'No Chat Activity',
          details: `${name} has no recorded chat activity (0 stars). Encourage participation in squad channels.`,
        });
      }

      // LOW_CHAT_ACTIVITY - less than 2 stars
      if (stars > 0 && stars < 2) {
        console.log(`  -> ACTION: Low Chat Activity`);
        actions.push({
          id: String(actionId++),
          type: 'low-chat-activity',
          severity: 'medium',
          sailor: name,
          rank: rank,
          squad: squad,
          description: 'Low Chat Activity',
          details: `${name} has low chat activity (${stars} stars). Consider outreach or mentoring.`,
        });
      }

      // COMPLIANCE_ISSUE - Only flag serious compliance issues (Inactive, Flagged, No)
      // Don't flag: Empty cells, "Active", or temporary LOA statuses
      if (compliance) {
        const complianceLower = compliance.toLowerCase().trim();
        
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
            rank: rank,
            squad: squad,
            description: `Compliance: ${complianceType}`,
            details: `${name} is marked as ${complianceType}. Review status and take appropriate action.`,
          });
        }
      }

      // MISSING_NCO_RIBBON - NCO ranks without improvement ribbon
      const rankData = RANKS[rank];
      if (rankData && (rankData.rate === 'NCO' || rankData.rate === 'SNCO')) {
        // This would require medal tracking data - placeholder for now
        // In full implementation, check against crewMedals or similar data
      }

      // MISSING_OFFICER_RIBBON - Officer ranks without improvement ribbon
      if (rankData && (rankData.rate === 'JO' || rankData.rate === 'SO')) {
        // This would require medal tracking data - placeholder for now
      }
    });

    console.log('Total actions detected:', actions.length);
    console.log('=== END DEBUG ===');
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
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Rank</TableCell>
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
                      <Typography variant="body2">{action.rank}</Typography>
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
                Rank
              </Typography>
              <Typography variant="body1">{selectedAction?.rank}</Typography>
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
