import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { useSheetData } from '../context/SheetDataContext';
import { useSnapshots, CrewSnapshot, MonthlySnapshot } from '../context/SnapshotContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const ReportsTab = () => {
  const { data } = useSheetData();
  const { snapshots, createSnapshot, loadSnapshots, getSnapshotForMonth, deleteSnapshot } = useSnapshots();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [openSnapshotDialog, setOpenSnapshotDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonthSnapshot, setCurrentMonthSnapshot] = useState<MonthlySnapshot | null>(null);

  // Load snapshots on mount
  useEffect(() => {
    loadSnapshots();
  }, []);

  // Check if current month has a snapshot
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    const monthSnapshot = getSnapshotForMonth(currentMonth);
    setCurrentMonthSnapshot(monthSnapshot || null);
  }, [snapshots]);

  // Convert crew data to snapshot format
  const getCurrentCrewAsSnapshot = (): CrewSnapshot[] => {
    const sailors: CrewSnapshot[] = [];
    let currentSquad = 'Command Staff';

    const gullinData = data.gullinbursti;
    for (let i = 0; i < gullinData.rows.length; i++) {
      const row = gullinData.rows[i];
      const rankVal = (row[gullinData.headers[0]] || '').trim();
      const nameVal = (row[gullinData.headers[1]] || '').trim();

      // Skip empty rows
      if (rankVal === '' && nameVal === '') continue;

      // Skip header rows
      if (
        (rankVal === 'Rank' || rankVal.toLowerCase() === 'rank') &&
        (nameVal === 'Name' || nameVal.toLowerCase() === 'name')
      ) {
        continue;
      }

      // Update squad if this is a header row
      if (rankVal && nameVal === '') {
        currentSquad = rankVal;
        continue;
      }

      // Add crew member
      if (rankVal && nameVal) {
        sailors.push({
          rank: rankVal,
          name: nameVal,
          squad: currentSquad,
          compliance: (row[gullinData.headers[8]] || '').trim() || 'Unknown',
          timezone: (row[gullinData.headers[7]] || '').trim() || '-',
          stars: (row[gullinData.headers[10]] || '').trim() || '0',
        });
      }
    }

    return sailors;
  };

  // Handle creating a new snapshot
  const handleCreateSnapshot = async () => {
    setSaving(true);
    try {
      const crewData = getCurrentCrewAsSnapshot();
      await createSnapshot(crewData);
      setOpenSnapshotDialog(false);
    } catch (err) {
      console.error('Error creating snapshot:', err);
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF report
  const generatePDF = (snapshot: MonthlySnapshot) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 10;

      // Title
      doc.setFontSize(16);
      doc.text('USN Ship Manager - Crew Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date info
      doc.setFontSize(10);
      doc.text(`Report Date: ${new Date(snapshot.date).toLocaleDateString()}`, 10, yPosition);
      doc.text(`Total Crew: ${snapshot.totalCrew}`, 10, yPosition + 5);
      doc.text(`In Compliance: ${snapshot.complianceCount}`, 10, yPosition + 10);
      yPosition += 20;

      // Squad breakdown
      doc.setFontSize(12);
      doc.text('Squad Breakdown:', 10, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      Object.entries(snapshot.squadBreakdown).forEach(([squad, count]) => {
        doc.text(`${squad}: ${count}`, 15, yPosition);
        yPosition += 5;
      });

      yPosition += 10;

      // Crew table
      doc.setFontSize(11);
      doc.text('Crew Roster:', 10, yPosition);
      yPosition += 8;

      const tableData = snapshot.crew.map((sailor) => [
        sailor.rank,
        sailor.name,
        sailor.squad,
        sailor.compliance,
        sailor.timezone,
      ]);

      // Check if autoTable exists
      if ((doc as any).autoTable) {
        (doc as any).autoTable({
          head: [['Rank', 'Name', 'Squad', 'Compliance', 'Timezone']],
          body: tableData,
          startY: yPosition,
          margin: 10,
          styles: { fontSize: 8 },
        });
      } else {
        console.warn('autoTable not available, generating PDF without table');
      }

      doc.save(`USN_Ship_Report_${snapshot.date}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Ship Report" />
        <Tab label="Squad Reports" />
        <Tab label="Snapshots" />
      </Tabs>

      {/* Ship Report Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Full Ship Report
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Generate a comprehensive report of all crew members and their current status.
            </Typography>
            {currentMonthSnapshot ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Month snapshot available from {new Date(currentMonthSnapshot.date).toLocaleDateString()}
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No snapshot for current month. Create one to track changes.
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const crew = getCurrentCrewAsSnapshot();
                  const snapshot: MonthlySnapshot = {
                    date: new Date().toISOString().split('T')[0],
                    month: new Date().toISOString().substring(0, 7),
                    crew,
                    totalCrew: crew.length,
                    complianceCount: crew.filter(
                      (c) =>
                        c.compliance.toLowerCase().includes('active') ||
                        c.compliance.toLowerCase().includes('duty')
                    ).length,
                    squadBreakdown: crew.reduce(
                      (acc, member) => {
                        acc[member.squad] = (acc[member.squad] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    ),
                  };
                  generatePDF(snapshot);
                }}
              >
                Download PDF
              </Button>
              <Button variant="contained" color="info" size="small" disabled>
                Download Word (Coming Soon)
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Squad Reports
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Generate individual reports for each squad with member details.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="contained" color="primary" size="small" disabled>
                Download All (Coming Soon)
              </Button>
              <Button variant="contained" color="info" size="small" disabled>
                Individual Squad Reports (Coming Soon)
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Squad Reports Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Squad Reports
          </Typography>
          <Typography color="textSecondary">
            Squad-specific reporting features coming soon. You'll be able to generate detailed reports
            for each squad with metrics, member status, and historical comparisons.
          </Typography>
        </Paper>
      )}

      {/* Snapshots Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Monthly Snapshots</Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={() => setOpenSnapshotDialog(true)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Create Snapshot'}
            </Button>
          </Box>

          {snapshots.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No snapshots yet. Create one to start tracking crew changes over time.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total Crew</TableCell>
                    <TableCell align="right">In Compliance</TableCell>
                    <TableCell align="right">Compliance %</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshots.map((snapshot) => (
                    <TableRow key={snapshot.date} hover>
                      <TableCell>{new Date(snapshot.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{snapshot.totalCrew}</TableCell>
                      <TableCell align="right">{snapshot.complianceCount}</TableCell>
                      <TableCell align="right">
                        {((snapshot.complianceCount / snapshot.totalCrew) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => generatePDF(snapshot)}
                          sx={{ mr: 1 }}
                        >
                          PDF
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => deleteSnapshot(snapshot.date)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Create Snapshot Dialog */}
      <Dialog open={openSnapshotDialog} onClose={() => setOpenSnapshotDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Crew Snapshot</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              This will capture the current crew roster as a snapshot for the month. You can use this to
              compare changes at the end of the month.
            </Typography>
            <Card sx={{ p: 2, bgcolor: 'background.default' }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Snapshot Details:</strong>
                </Typography>
                <Typography variant="caption">
                  Date: {new Date().toLocaleDateString()}
                </Typography>
                <br />
                <Typography variant="caption">
                  Crew Members: {getCurrentCrewAsSnapshot().length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSnapshotDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSnapshot}
            variant="contained"
            color="success"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Creating...' : 'Create Snapshot'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
