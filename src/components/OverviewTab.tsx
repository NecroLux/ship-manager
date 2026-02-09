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
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSheetData } from '../context/SheetDataContext';

interface ActionItem {
  sailor: string;
  actionType: 'attention' | 'promotion' | 'activity' | 'award';
  details: string;
  priority: 'high' | 'medium' | 'low';
}

export const OverviewTab = () => {
  const { data, loading, refreshData } = useSheetData();

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Analyze data for key insights
  const analyzeData = (): {
    actionItems: ActionItem[];
    sailorCount: number;
    awardCount: number;
    promotionCandidates: ActionItem[];
    lowActivitySailors: ActionItem[];
  } => {
    const voyageRows = data.voyageAwards.rows;
    const gullinburstiRows = data.gullinbursti.rows;

    const actionItems: ActionItem[] = [];
    let awardCount = 0;

    // Find sailors with empty or missing data (action required)
    voyageRows.forEach((row) => {
      const sailorName = row['Name'] || row['Sailor'] || '';
      
      // Check for missing information
      const hasEmptyFields = Object.values(row).filter(v => !v || v === '-').length > 3;
      if (hasEmptyFields && sailorName) {
        actionItems.push({
          sailor: sailorName,
          actionType: 'attention',
          details: 'Missing or incomplete profile information',
          priority: 'high',
        });
      }

      // Count awards (non-empty, non-"-" values in award-related columns)
      const awardColumns = Object.keys(row).filter(key => 
        key.toLowerCase().includes('award') || 
        key.toLowerCase().includes('medal') ||
        key.toLowerCase().includes('promotion')
      );
      awardColumns.forEach(col => {
        if (row[col] && row[col] !== '-' && row[col].trim()) {
          awardCount++;
        }
      });
    });

    // Analyze Gullinbursti data for activity and crew assignments
    const promotionCandidates: ActionItem[] = [];
    const lowActivitySailors: ActionItem[] = [];

    gullinburstiRows.forEach((row) => {
      const sailorName = row[gullinburstiRows.length > 0 ? Object.keys(row)[0] : 'Name'] || '';
      
      if (!sailorName || sailorName === '-') return;

      // Look for promotion indicators (this depends on your sheet structure)
      const promotionRelevantCols = Object.keys(row).filter(key => 
        key.toLowerCase().includes('rank') || 
        key.toLowerCase().includes('role') ||
        key.toLowerCase().includes('position')
      );
      
      const hasPromotionRelevantData = promotionRelevantCols.some(col => row[col] && row[col].trim());
      if (hasPromotionRelevantData && Math.random() > 0.7) { // Simulated logic - adjust based on actual data
        promotionCandidates.push({
          sailor: sailorName,
          actionType: 'promotion',
          details: 'Ready for rank advancement review',
          priority: 'medium',
        });
      }

      // Check activity level (simple heuristic based on data completeness)
      const filledColumns = Object.values(row).filter(v => v && v !== '-').length;
      const totalColumns = Object.keys(row).length;
      const completionRate = filledColumns / totalColumns;

      if (completionRate < 0.3) {
        lowActivitySailors.push({
          sailor: sailorName,
          actionType: 'activity',
          details: 'Low engagement - incomplete Discord/activity data',
          priority: 'medium',
        });
      }
    });

    return {
      actionItems,
      sailorCount: voyageRows.length,
      awardCount,
      promotionCandidates,
      lowActivitySailors: lowActivitySailors.slice(0, 5), // Show top 5
    };
  };

  const insights = analyzeData();

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'attention':
        return 'error';
      case 'promotion':
        return 'success';
      case 'activity':
        return 'warning';
      case 'award':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#d32f2f';
      case 'medium':
        return '#f57c00';
      case 'low':
        return '#1976d2';
      default:
        return '#757575';
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Summary Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography color="textSecondary" gutterBottom>
                  Total Crew
                </Typography>
                <Typography variant="h4">
                  {insights.sailorCount}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography color="textSecondary" gutterBottom>
                  Flagged Crew
                </Typography>
                <Typography variant="h4" sx={{ color: 'error.main' }}>
                  {insights.actionItems.length}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography color="textSecondary" gutterBottom>
                  Pending Awards
                </Typography>
                <Typography variant="h4" sx={{ color: 'warning.main' }}>
                  {insights.awardCount}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography color="textSecondary" gutterBottom>
                  Pending Promotions
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.main' }}>
                  {insights.promotionCandidates.length}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Sailors Requiring Action */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="error" />
              Sailors Requiring Attention
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
            >
              Refresh
            </Button>
          </Box>

          {insights.actionItems.length === 0 ? (
            <Typography color="textSecondary">
              All sailors are in good standing!
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sailor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insights.actionItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.sailor}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.actionType.charAt(0).toUpperCase() + item.actionType.slice(1)}
                          color={getActionColor(item.actionType) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{item.details}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.priority.toUpperCase()}
                          sx={{
                            backgroundColor: getPriorityColor(item.priority),
                            color: 'white',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Promotion Candidates */}
      {insights.promotionCandidates.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon color="success" />
              Promotion Candidates
            </Typography>
            <Stack spacing={1}>
              {insights.promotionCandidates.map((item, idx) => (
                <Paper key={idx} sx={{ p: 2, backgroundColor: 'success.light' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.sailor}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.details}
                      </Typography>
                    </Box>
                    <ThumbUpIcon color="success" />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Low Activity Sailors */}
      {insights.lowActivitySailors.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonAddIcon color="warning" />
              Low Activity - Follow Up Recommended
            </Typography>
            <Stack spacing={1}>
              {insights.lowActivitySailors.map((item, idx) => (
                <Paper key={idx} sx={{ p: 2, backgroundColor: 'warning.light' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.sailor}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.details}
                      </Typography>
                    </Box>
                    <Chip label="Follow up" variant="outlined" size="small" />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
