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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSheetData } from '../context/SheetDataContext';
import { useState } from 'react';

interface RoleAction {
  id: string;
  actionItem: string;
  assignedSailor: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

interface RoleTab {
  role: 'Command' | 'First Officer' | 'Chief of Ship' | 'Squad Leaders';
  actions: RoleAction[];
}

export const ActionsTab = () => {
  const { loading, refreshData } = useSheetData();
  const [activeRole, setActiveRole] = useState(0);

  if (loading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Mock action data structure - this will be populated from sheet data
  const roleActions: RoleTab[] = [
    {
      role: 'Command',
      actions: [
        {
          id: '1',
          actionItem: 'Review promotion recommendations for Q1',
          assignedSailor: 'Captain',
          dueDate: '2026-02-28',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '2',
          actionItem: 'Approve expedition plan for Fleet Operations',
          assignedSailor: 'Captain',
          dueDate: '2026-02-15',
          status: 'in-progress',
          priority: 'high',
        },
        {
          id: '3',
          actionItem: 'Conduct crew evaluations',
          assignedSailor: 'Captain',
          status: 'pending',
          priority: 'medium',
        },
      ],
    },
    {
      role: 'First Officer',
      actions: [
        {
          id: '4',
          actionItem: 'Coordinate training schedule for new recruits',
          assignedSailor: 'First Officer',
          dueDate: '2026-02-20',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '5',
          actionItem: 'Submit monthly operational report',
          assignedSailor: 'First Officer',
          dueDate: '2026-02-28',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '6',
          actionItem: 'Review sail maintenance logs',
          assignedSailor: 'First Officer',
          status: 'completed',
          priority: 'low',
        },
      ],
    },
    {
      role: 'Chief of Ship',
      actions: [
        {
          id: '7',
          actionItem: 'Inventory ship supplies and equipment',
          assignedSailor: 'Chief of Ship',
          dueDate: '2026-02-14',
          status: 'in-progress',
          priority: 'high',
        },
        {
          id: '8',
          actionItem: 'Schedule maintenance for ship systems',
          assignedSailor: 'Chief of Ship',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '9',
          actionItem: 'Brief crew on safety protocols',
          assignedSailor: 'Chief of Ship',
          dueDate: '2026-02-21',
          status: 'pending',
          priority: 'high',
        },
      ],
    },
    {
      role: 'Squad Leaders',
      actions: [
        {
          id: '10',
          actionItem: 'Conduct weekly squad reviews',
          assignedSailor: 'All Squad Leaders',
          dueDate: '2026-02-13',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '11',
          actionItem: 'Submit attendance reports',
          assignedSailor: 'All Squad Leaders',
          dueDate: '2026-02-28',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '12',
          actionItem: 'Identify sailors needing mentorship',
          assignedSailor: 'All Squad Leaders',
          status: 'in-progress',
          priority: 'high',
        },
        {
          id: '13',
          actionItem: 'Monitor Discord activity in squads',
          assignedSailor: 'All Squad Leaders',
          status: 'pending',
          priority: 'low',
        },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'completed':
        return 'success';
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

  const currentRole = roleActions[activeRole];
  const pendingCount = currentRole.actions.filter(a => a.status === 'pending').length;
  const completedCount = currentRole.actions.filter(a => a.status === 'completed').length;

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Leadership Action Items
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Track and manage responsibilities for each leadership role
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

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeRole} onChange={(_e, newValue) => setActiveRole(newValue)}>
              {roleActions.map((roleTab, idx) => (
                <Tab key={idx} label={roleTab.role} />
              ))}
            </Tabs>
          </Box>

          {/* Role Summary */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, flex: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="textSecondary">
                Pending Actions
              </Typography>
              <Typography variant="h6" sx={{ color: 'warning.main' }}>
                {pendingCount}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="textSecondary">
                In Progress
              </Typography>
              <Typography variant="h6" sx={{ color: 'info.main' }}>
                {currentRole.actions.filter(a => a.status === 'in-progress').length}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, backgroundColor: 'action.hover' }}>
              <Typography variant="caption" color="textSecondary">
                Completed
              </Typography>
              <Typography variant="h6" sx={{ color: 'success.main' }}>
                {completedCount}
              </Typography>
            </Paper>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Items Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Action Item</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentRole.actions.map((action) => (
                <TableRow key={action.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {action.actionItem}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {action.assignedSailor}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {action.dueDate ? (
                      <Typography variant="body2">{new Date(action.dueDate).toLocaleDateString()}</Typography>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        No due date
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                      color={getStatusColor(action.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={action.priority.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(action.priority),
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {action.status !== 'completed' && (
                        <Button size="small" variant="outlined">
                          Mark Done
                        </Button>
                      )}
                      <Button size="small" variant="text">
                        Edit
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Notes Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Role Notes for {currentRole.role}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {currentRole.role === 'Command' && (
              'Commanding Officer is responsible for overall strategic decisions, crew welfare, promotions, and major ship operations. Focus on long-term goals and crew development.'
            )}
            {currentRole.role === 'First Officer' && (
              'First Officer manages day-to-day operations, training programs, and coordinates between command and crew. Ensure smooth workflow and crew satisfaction.'
            )}
            {currentRole.role === 'Chief of Ship' && (
              'Chief of Ship oversees ship maintenance, supplies, safety protocols, and technical operations. Maintain ship readiness and crew safety.'
            )}
            {currentRole.role === 'Squad Leaders' && (
              'Squad Leaders are responsible for their specific squads\' performance, attendance, mentorship, and engagement. Report issues to higher command as needed.'
            )}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
