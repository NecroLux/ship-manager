import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useState } from 'react';
import { useSheetData } from '../context/SheetDataContext';
import {
  parseAllCrewMembers,
  parseAllLeaderboardEntries,
  enrichCrewWithLeaderboardData,
} from '../services/dataParser';
import jsPDF from 'jspdf';

export const ReportsTab = () => {
  const { data } = useSheetData();
  const [coNotes, setCoNotes] = useState<string>('');

  // Generate PDF report using live data — matches Overview & Crew tabs exactly
  const generatePDF = (notes: string = '') => {
    try {
      const crew = parseAllCrewMembers(data.gullinbursti?.rows || []);
      if (!crew || crew.length === 0) {
        alert('No crew data available for the report.');
        return;
      }

      // Get leaderboard data (same source as Overview tab)
      const leaderboardData = data.voyageAwards?.rows
        ? parseAllLeaderboardEntries(data.voyageAwards.rows)
        : [];

      // Enrich crew with voyage/host counts (same as Crew tab)
      const enrichedCrew = crew.map((m) => enrichCrewWithLeaderboardData(m, leaderboardData));

      // Split into squad groups
      const commandStaff = enrichedCrew.filter((m) => m.squad === 'Command Staff');
      const squad1 = enrichedCrew.filter((m) => m.squad !== 'Command Staff' && m.squad !== 'Unassigned' && !m.squad.toLowerCase().includes('shade'));
      const squad2 = enrichedCrew.filter((m) => m.squad.toLowerCase().includes('shade'));
      const unassigned = enrichedCrew.filter((m) => m.squad === 'Unassigned');

      // Stats — date-based sailing compliance (matching new rules)
      const totalCrew = crew.length;
      const complianceNow = new Date();
      const isSailingOk = (c: typeof enrichedCrew[0]) => {
        if (c.loaStatus) return true;
        if (c.lastVoyageDate) {
          const lv = new Date(c.lastVoyageDate);
          if (!isNaN(lv.getTime())) return Math.floor((complianceNow.getTime() - lv.getTime()) / (1000 * 60 * 60 * 24)) < 14;
        }
        if (c.daysInactive > 0) return c.daysInactive < 14;
        return false;
      };
      const compliantCount = enrichedCrew.filter(isSailingOk).length;
      const attentionCount = totalCrew - compliantCount;
      const complianceRate = totalCrew > 0 ? Math.round((compliantCount / totalCrew) * 100) : 0;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper: add new page if not enough space
      const addPageIfNeeded = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > pageHeight - 15) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Helper: draw a section title
      const drawSectionTitle = (title: string) => {
        addPageIfNeeded(15);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += 2;
        doc.setDrawColor(100);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 3;
      };

      // Helper: draw a stat line
      const drawStatLine = (label: string, value: string | number) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${label}: ${value}`, margin, yPosition);
        yPosition += 5;
      };

      // ===== PAGE 1: HEADER =====
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTHLY SHIP REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      doc.text(`USS Gullinbursti \u2014 ${monthName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.setFontSize(10);
      doc.text(`Report Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setLineWidth(0.2);
      yPosition += 6;

      // ===== SHIP STATISTICS (matches Overview cards) =====
      drawSectionTitle('SHIP STATISTICS');

      drawStatLine('Total Members', totalCrew);
      drawStatLine('Sailing Compliant (incl. LOA)', compliantCount);
      drawStatLine('Attention Required', attentionCount);
      drawStatLine('Compliance Rate', `${complianceRate}%`);
      yPosition += 3;

      // ===== SQUAD BREAKDOWN =====
      drawSectionTitle('SQUAD BREAKDOWN');

      const squadGroups = [
        { label: 'Command Staff', members: commandStaff },
        { label: squad1.length > 0 ? squad1[0].squad : 'Squad 1', members: squad1 },
        { label: squad2.length > 0 ? squad2[0].squad : 'Squad 2', members: squad2 },
      ];
      if (unassigned.length > 0) {
        squadGroups.push({ label: 'Unassigned', members: unassigned });
      }

      squadGroups.forEach((sg) => {
        const sgCompliant = sg.members.filter(isSailingOk).length;
        const sgRate = sg.members.length > 0 ? Math.round((sgCompliant / sg.members.length) * 100) : 0;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${sg.label}: ${sg.members.length} members (${sgRate}% compliant)`, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 6;

      // ===== CREW ROSTER — SPLIT BY SQUAD =====

      const drawSquadRoster = (title: string, members: typeof enrichedCrew, startNewPage: boolean = false) => {
        if (startNewPage) {
          doc.addPage();
          yPosition = margin;
        } else {
          yPosition += 8;
          addPageIfNeeded(30);
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += 2;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        doc.setLineWidth(0.2);
        yPosition += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${members.length} members`, margin, yPosition);
        yPosition += 6;

        if (members.length === 0) {
          doc.text('No members in this group.', margin, yPosition);
          yPosition += 4;
          return;
        }

        // Table columns: Rank | Name | Status | Sail | Voy | Host | Notes
        const colX = {
          rank: margin,
          name: margin + 22,
          status: margin + 52,
          sailing: margin + 66,
          voyages: margin + 80,
          hosted: margin + 98,
          notes: margin + 116,
        };

        // Header row
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Rank', colX.rank, yPosition);
        doc.text('Name', colX.name, yPosition);
        doc.text('Status', colX.status, yPosition);
        doc.text('Sail', colX.sailing, yPosition);
        doc.text('Voy', colX.voyages, yPosition);
        doc.text('Host', colX.hosted, yPosition);
        doc.text('Notes', colX.notes, yPosition);
        yPosition += 2;

        doc.setDrawColor(180);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        members.forEach((sailor) => {
          // Estimate notes height if present
          let rowHeight = 4.5;
          const notes = sailor.squadLeaderComments || sailor.cosNotes ? (sailor.squadLeaderComments || '') + ' ' + (sailor.cosNotes || '') : '';
          if (notes.trim()) {
            const noteLines = doc.splitTextToSize(notes, 40);
            rowHeight += noteLines.length * 2.5;
          }

          addPageIfNeeded(rowHeight);

          // Rank
          doc.text(sailor.rank.substring(0, 16), colX.rank, yPosition);

          // Name
          doc.text(sailor.name.substring(0, 18), colX.name, yPosition);

          // Status
          const loaRaw = (sailor.complianceStatus || '').trim().toLowerCase();
          let statusLabel = 'Act';
          if (loaRaw.includes('loa-1')) statusLabel = 'LOA1';
          else if (loaRaw.includes('loa-2')) statusLabel = 'LOA2';
          else if (loaRaw.includes('loa')) statusLabel = 'LOA';
          doc.text(statusLabel, colX.status, yPosition);

          // Sailing
          let sailingLabel = '~';
          if (sailor.loaStatus) {
            sailingLabel = '—';
          } else {
            let sailDays = -1;
            if (sailor.lastVoyageDate) {
              const lv = new Date(sailor.lastVoyageDate);
              if (!isNaN(lv.getTime())) sailDays = Math.floor((now.getTime() - lv.getTime()) / (1000 * 60 * 60 * 24));
            } else if (sailor.daysInactive > 0) {
              sailDays = sailor.daysInactive;
            }
            if (sailDays >= 0 && sailDays < 14) sailingLabel = '✓';
            else if (sailDays >= 30) sailingLabel = '!';
          }
          doc.text(sailingLabel, colX.sailing, yPosition);

          // Voyages & Hosted
          doc.text(String(sailor.voyageCount), colX.voyages, yPosition);
          doc.text(String(sailor.hostCount), colX.hosted, yPosition);

          // Notes in column
          const notesText = sailor.squadLeaderComments || sailor.cosNotes 
            ? (sailor.squadLeaderComments ? 'SL: ' + sailor.squadLeaderComments : '') +
              (sailor.cosNotes ? (sailor.squadLeaderComments ? ' | CoS: ' : 'CoS: ') + sailor.cosNotes : '')
            : '';
          
          if (notesText) {
            const noteLines = doc.splitTextToSize(notesText, 40);
            doc.setFontSize(7);
            doc.text(noteLines, colX.notes, yPosition);
            yPosition += noteLines.length * 2.5;
          } else {
            yPosition += 2.5;
          }

          yPosition += 2;
        });
      };

      // ===== PAGE 1: COMMAND STAFF ROSTER =====
      drawSquadRoster('COMMAND STAFF', commandStaff, false);

      // ===== PAGE 1 CONTINUED: FIRST SQUAD ROSTER =====
      const squad1Label = squad1.length > 0 ? squad1[0].squad.toUpperCase() : 'SQUAD 1';
      drawSquadRoster(squad1Label, squad1, false);

      // ===== PAGE 2: SHADE SQUAD + CO NOTES =====
      const squad2Label = squad2.length > 0 ? squad2[0].squad.toUpperCase() : 'SQUAD 2';
      drawSquadRoster(squad2Label, squad2, true);

      if (unassigned.length > 0) {
        drawSquadRoster('UNASSIGNED', unassigned, false);
      }

      // ===== CO NOTES (same page as Shade Squad) =====
      yPosition += 8;
      addPageIfNeeded(40);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COMMANDING OFFICER NOTES', margin, yPosition);
      yPosition += 2;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setLineWidth(0.2);
      yPosition += 6;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const notesText = notes || 'No additional notes provided.';
      const splitNotes = doc.splitTextToSize(notesText, contentWidth);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 5 + 10;

      // Signature
      addPageIfNeeded(25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LCDR Hoit', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Commanding Officer, USS Gullinbursti', margin, yPosition);
      yPosition += 12;

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128);
      doc.text('Generated by USN Ship Manager', margin, yPosition);
      yPosition += 4;
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
      doc.setTextColor(0);

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`USS_Gullinbursti_Report_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Full Ship Report
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Generate a comprehensive PDF report of all crew members and their current status using live sheet data.
          </Typography>
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
              onClick={() => generatePDF(coNotes)}
            >
              Download PDF
            </Button>
            <Button variant="contained" color="info" size="small" disabled>
              Download Word (Coming Soon)
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
