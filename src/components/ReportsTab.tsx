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
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable side-effect import
import 'jspdf-autotable';

// Ensure autoTable is available
const ensureAutoTable = (doc: any) => {
  if (!doc.autoTable) {
    console.warn('autoTable not available, using fallback');
    (doc as any).autoTable = () => {
      (doc as any).lastAutoTable = { finalY: (doc as any).lastAutoTable?.finalY || 0 };
      return doc;
    };
  }
};

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

  // Extract leaderboards from voyage awards sheet
  const getLeaderboards = () => {
    const voyageRows = data.voyageAwards.rows;
    const headers = data.voyageAwards.headers;

    console.log('=== LEADERBOARD EXTRACTION DEBUG ===');
    console.log('Voyage Awards Headers:', headers);
    console.log('Voyage Awards Row Count:', voyageRows.length);

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

    console.log('Crew names to match:', Array.from(crewNames).slice(0, 5));

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
        console.log(`Matched: ${matchedName} - Hosts: ${hostCount}, Voyages: ${voyageCount}`);
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

    console.log('Matched Crew Found:', crewArray.length);
    console.log('Top Hosts:', topHosts);
    console.log('Top Voyagers:', topVoyagers);
    console.log('=== END LEADERBOARD DEBUG ===');

    return { topHosts, topVoyagers };
  };

  // Generate PDF report
  const generatePDF = (snapshot: MonthlySnapshot, notes: string = '') => {
    try {
      const { topHosts, topVoyagers } = getLeaderboards();
      console.log('PDF Generation - Top Hosts:', topHosts);
      console.log('PDF Generation - Top Voyagers:', topVoyagers);
      console.log('PDF Generation - Crew count:', snapshot.crew.length);
      console.log('PDF Generation - Squad breakdown:', snapshot.squadBreakdown);
      
      const doc = new jsPDF();
      ensureAutoTable(doc);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      let yPosition = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > pageHeight - 15) {
          doc.addPage();
          yPosition = margin;
        }
        return yPosition;
      };

      // ===== HEADER SECTION =====
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTHLY SHIP REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const reportDate = new Date(snapshot.date);
      const monthName = reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      doc.text(`USS Gullinbursti - Report for ${monthName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Report Date: ${reportDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Horizontal line
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // ===== SHIP STATISTICS SECTION =====
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIP STATISTICS', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Stats boxes
      const boxWidth = (pageWidth - margin * 2 - 2) / 3;
      const boxHeight = 16;
      const boxY = yPosition;

      const stats = [
        { label: 'Total Members', value: String(snapshot.totalCrew) },
        { label: 'In Compliance', value: String(snapshot.complianceCount) },
        { label: 'Compliance Rate', value: snapshot.totalCrew > 0 ? `${Math.round((snapshot.complianceCount / snapshot.totalCrew) * 100)}%` : 'N/A' },
      ];

      stats.forEach((stat, idx) => {
        const boxX = margin + (idx * (boxWidth + 1));
        doc.setFillColor(245, 245, 245);
        doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(boxX, boxY, boxWidth, boxHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(stat.label, boxX + boxWidth / 2, boxY + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(stat.value, boxX + boxWidth / 2, boxY + 11, { align: 'center' });
      });

      yPosition = boxY + boxHeight + 8;

      // ===== SQUAD BREAKDOWN SECTION =====
      yPosition = checkPageBreak(20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SQUAD BREAKDOWN', margin, yPosition);
      yPosition += 6;

      const squadData = Object.entries(snapshot.squadBreakdown).map(([squad, count]) => {
        const percentage = snapshot.totalCrew > 0 ? Math.round((count / snapshot.totalCrew) * 100) : 0;
        return [squad, String(count), `${percentage}%`];
      });

      doc.setFontSize(9);
      if (squadData.length > 0) {
        (doc as any).autoTable({
          head: [['Squad', 'Members', 'Percentage']],
          body: squadData,
          startY: yPosition,
          margin: margin,
          styles: { fontSize: 9, cellPadding: 3 },
          headerStyles: { fillColor: [30, 100, 200], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('No squad breakdown available', margin, yPosition);
        yPosition += 6;
      }

      // ===== TOP HOSTS LEADERBOARD =====
      yPosition = checkPageBreak(25);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP SHIP HOSTS', margin, yPosition);
      yPosition += 6;

      if (topHosts.length > 0) {
        const hostsData = topHosts.map((sailor) => [
          sailor.name,
          String(sailor.hostCount),
        ]);

        (doc as any).autoTable({
          head: [['Sailor', 'Total Hosted']],
          body: hostsData,
          startY: yPosition,
          margin: margin,
          styles: { fontSize: 9, cellPadding: 3 },
          headerStyles: { fillColor: [30, 100, 200], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('No hosting data available', margin, yPosition);
        yPosition += 6;
      }

      // ===== TOP VOYAGERS LEADERBOARD =====
      yPosition = checkPageBreak(25);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP SHIP VOYAGERS', margin, yPosition);
      yPosition += 6;

      if (topVoyagers.length > 0) {
        const voyagersData = topVoyagers.map((sailor) => [
          sailor.name,
          String(sailor.voyageCount),
        ]);

        (doc as any).autoTable({
          head: [['Sailor', 'Total Voyages']],
          body: voyagersData,
          startY: yPosition,
          margin: margin,
          styles: { fontSize: 9, cellPadding: 3 },
          headerStyles: { fillColor: [30, 100, 200], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('No voyage data available', margin, yPosition);
        yPosition += 6;
      }

      // ===== CREW ROSTER SECTION =====
      yPosition = checkPageBreak(30);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CREW ROSTER', margin, yPosition);
      yPosition += 6;

      const crewTableData = snapshot.crew.map((sailor) => [
        sailor.rank,
        sailor.name,
        sailor.squad,
        sailor.compliance || 'Active',
        sailor.timezone,
      ]);

      if (crewTableData.length > 0) {
        (doc as any).autoTable({
          head: [['Rank', 'Name', 'Squad', 'Status', 'Timezone']],
          body: crewTableData,
          startY: yPosition,
          margin: margin,
          styles: { fontSize: 8, cellPadding: 2 },
          headerStyles: { fillColor: [30, 100, 200], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
          },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('No crew roster data available', margin, yPosition);
        yPosition += 6;
      }

      // ===== NOTES SECTION =====
      yPosition = checkPageBreak(20);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('COMMANDING OFFICER NOTES', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const notesText = notes || 'Please add any additional notes or observations about ship activities, crew performance, or operational concerns here. This section should contain key insights and recommendations for leadership.';
      const splitNotes = doc.splitTextToSize(notesText, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 3 + 4;

      // ===== REPORT SIGNATURE SECTION =====
      yPosition = checkPageBreak(15);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by USN Ship Manager', margin, yPosition);
      yPosition += 5;
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 5;

      // ===== FOOTER WITH PAGE NUMBERS =====
      const pageCount = (doc as any).internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
        doc.text(
          `USS Gullinbursti Monthly Report - ${monthName}`,
          margin,
          pageHeight - 8
        );
      }

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
