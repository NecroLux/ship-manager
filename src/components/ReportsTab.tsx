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
  TextField,
  useTheme,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { useSheetData } from '../context/SheetDataContext';
import { useSnapshots, CrewSnapshot, MonthlySnapshot } from '../context/SnapshotContext';
import { parseAllCrewMembers } from '../services/dataParser';
import jsPDF from 'jspdf';

export const ReportsTab = () => {
  const { data } = useSheetData();
  const { snapshots, createSnapshot, loadSnapshots, getSnapshotForMonth, deleteSnapshot } = useSnapshots();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [openSnapshotDialog, setOpenSnapshotDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonthSnapshot, setCurrentMonthSnapshot] = useState<MonthlySnapshot | null>(null);
  const [coNotes, setCoNotes] = useState<string>('');

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

  // Convert crew data to snapshot format using centralized parser
  const getCurrentCrewAsSnapshot = (): CrewSnapshot[] => {
    const crew = parseAllCrewMembers(data.gullinbursti?.rows || []);
    return crew.map((member) => ({
      rank: member.rank,
      name: member.name,
      squad: member.squad,
      compliance: member.loaStatus ? 'LOA' : member.sailingCompliant && member.hostingCompliant ? 'Compliant' : 'Requires Attention',
      timezone: member.timezone,
      stars: member.chatActivity.toString(),
    }));
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

  // Extract leaderboards from voyage awards sheet
  const getLeaderboards = () => {
  const voyageRows = data.voyageAwards.rows;

  // Leaderboard extraction - debug logs removed for production

    if (!voyageRows || voyageRows.length === 0) {
      return { topHosts: [], topVoyagers: [] };
    }

    interface VoyageRow {
      name: string;
      hostCount: number;
      voyageCount: number;
      [key: string]: string | number;
    }

    const crew: Record<string, VoyageRow> = {};

    // Parse voyage sheet data - match names from gullinbursti crew list
    const crewNames = new Set<string>();
    data.gullinbursti.rows.forEach((row) => {
      const name = (row[data.gullinbursti.headers[1]] || '').trim();
      if (name && name !== 'Name') {
        crewNames.add(name);
      }
    });

  // crew names to match (debugging removed)

    voyageRows.forEach((row) => {
      // Check each column value to find if it matches a known crew name
      let matchedName = '';
      let hostCount = 0;
      let voyageCount = 0;

      Object.entries(row).forEach(([key, value]) => {
        const valueStr = (value || '').trim();
        
        // Check if this value is a known crew member name
        if (!matchedName && crewNames.has(valueStr)) {
          matchedName = valueStr;
        }

        // Extract host count (usually in a "Host" or similar column)
        const keyLower = key.toLowerCase();
        if (keyLower.includes('host') && !isNaN(Number(value))) {
          hostCount = Math.max(hostCount, parseInt(value as string, 10) || 0);
        }
        
        // Extract voyage count (usually in a "Voyage" or "Total" column)
        if (keyLower.includes('voyage') && !isNaN(Number(value))) {
          voyageCount = Math.max(voyageCount, parseInt(value as string, 10) || 0);
        }
      });

      if (matchedName && (hostCount > 0 || voyageCount > 0)) {
  // matched entry (debugging removed)
        if (!crew[matchedName]) {
          crew[matchedName] = { name: matchedName, hostCount: 0, voyageCount: 0 };
        }
        crew[matchedName].hostCount = Math.max(crew[matchedName].hostCount, hostCount);
        crew[matchedName].voyageCount = Math.max(crew[matchedName].voyageCount, voyageCount);
      }
    });

    // Convert to arrays and sort
    const crewArray = Object.values(crew).filter(c => c.name && c.name !== '-');
    
    const topHosts = crewArray
      .filter(c => c.hostCount > 0)
      .sort((a, b) => b.hostCount - a.hostCount)
      .slice(0, 5);

    const topVoyagers = crewArray
      .filter(c => c.voyageCount > 0)
      .sort((a, b) => b.voyageCount - a.voyageCount)
      .slice(0, 5);

  // Leaderboard extraction complete
    return { topHosts, topVoyagers };
  };

  // Generate PDF report - SIMPLE VERSION without autoTable
  const generatePDF = (snapshot: MonthlySnapshot, notes: string = '') => {
    try {
      // Basic guard: ensure snapshot has crew entries
      if (!snapshot || !snapshot.crew || snapshot.crew.length === 0) {
        alert('No crew data available for the report. Create a snapshot first.');
        return;
      }

      const result = getLeaderboards() as any;
      const topHosts = (result?.topHosts) || [];
      const topVoyagers = (result?.topVoyagers) || [];
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      const addPageIfNeeded = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > pageHeight - 10) {
          doc.addPage();
          yPosition = margin;
        }
      };

  // ===== HEADER =====
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTHLY SHIP REPORT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 9;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
      const reportDate = new Date(snapshot.date);
      const monthName = reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      doc.text(`USS Gullinbursti - Report for ${monthName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Report Date: ${reportDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Line
      doc.setDrawColor(0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

  // ===== SHIP STATISTICS =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIP STATISTICS', margin, yPosition);
  yPosition += 7;

  const complianceRate = snapshot.totalCrew > 0 ? Math.round((snapshot.complianceCount / snapshot.totalCrew) * 100) : 0;
  const statText = `Total Members: ${snapshot.totalCrew}  |  In Compliance: ${snapshot.complianceCount}  |  Compliance Rate: ${complianceRate}%`;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(statText, margin, yPosition);
  yPosition += 8;

      // ===== SQUAD BREAKDOWN =====
      addPageIfNeeded(25);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('SQUAD BREAKDOWN', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(snapshot.squadBreakdown).forEach(([squad, count]) => {
        doc.text(`${squad}: ${count} members`, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 3;

      // ===== TOP HOSTS =====
      addPageIfNeeded(25);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP SHIP HOSTS', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (topHosts.length > 0) {
        topHosts.forEach((sailor: any, idx: number) => {
          doc.text(`${idx + 1}. ${sailor.name}: ${sailor.hostCount} voyages hosted`, margin + 5, yPosition);
          yPosition += 5;
        });
      } else {
        doc.text('No hosting data available', margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // ===== TOP VOYAGERS =====
      addPageIfNeeded(25);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP SHIP VOYAGERS', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (topVoyagers.length > 0) {
        topVoyagers.forEach((sailor: any, idx: number) => {
          doc.text(`${idx + 1}. ${sailor.name}: ${sailor.voyageCount} voyages attended`, margin + 5, yPosition);
          yPosition += 5;
        });
      } else {
        doc.text('No voyage data available', margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // ===== CREW ROSTER =====
      doc.addPage();
      yPosition = margin;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('CREW ROSTER', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      // Header row
      doc.setFont('helvetica', 'bold');
      doc.text('Rank', margin, yPosition);
      doc.text('Name', margin + 20, yPosition);
      doc.text('Squad', margin + 50, yPosition);
      doc.text('Status', margin + 85, yPosition);
      doc.text('Timezone', margin + 110, yPosition);
      yPosition += 5;

      // Separator
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;

      // Crew data
      doc.setFont('helvetica', 'normal');
      snapshot.crew.forEach((sailor) => {
        addPageIfNeeded(5);
        doc.text(sailor.rank.substring(0, 8), margin, yPosition);
        doc.text(sailor.name.substring(0, 15), margin + 20, yPosition);
        doc.text(sailor.squad.substring(0, 12), margin + 50, yPosition);
        doc.text((sailor.compliance || 'Active').substring(0, 15), margin + 85, yPosition);
        doc.text(sailor.timezone.substring(0, 10), margin + 110, yPosition);
        yPosition += 4;
      });

      yPosition += 3;

      // ===== CO NOTES =====
      yPosition += 5;
      addPageIfNeeded(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('COMMANDING OFFICER NOTES', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesText = notes || 'Please add any additional notes or observations about ship activities, crew performance, or operational concerns here. This section should contain key insights and recommendations for leadership.';
      const splitNotes = doc.splitTextToSize(notesText, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 4 + 5;

      // CO Signature
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('LCDR Hoit', margin, yPosition);
      yPosition += 4;
      doc.text('Commanding Officer', margin, yPosition);
      yPosition += 8;

      // ===== FOOTER =====
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128);
      doc.text('Generated by USN Ship Manager', margin, yPosition);
      yPosition += 4;
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, yPosition);

      // Save
      doc.save(`USS_Gullinbursti_Report_${snapshot.date}.pdf`);
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
        <Tab label="Snapshots" />
      </Tabs>

      {/* Ship Report Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Commanding Officer Notes (optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Add any notes, observations, or recommendations to include in the report..."
                value={coNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCoNotes(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
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
                  generatePDF(snapshot, coNotes);
                }}
              >
                Download PDF
              </Button>
              <Button variant="contained" color="info" size="small" disabled>
                Download Word (Coming Soon)
              </Button>
            </Box>
          </Paper>

          {/* Reports History Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report History
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Download previously generated monthly reports.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Alert severity="info">
                Report history will be populated as monthly reports are automatically generated on the last day of each month.
              </Alert>
              <Typography variant="caption" color="textSecondary">
                No reports available yet. Check back at the end of the month!
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Snapshots Tab */}
      {activeTab === 1 && (
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
