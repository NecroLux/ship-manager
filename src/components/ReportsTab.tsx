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
          addPageIfNeeded(35);
        }

        // Title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += 1;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        doc.setLineWidth(0.2);
        yPosition += 8;

        // Member count
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${members.length} members`, margin, yPosition);
        yPosition += 8;

        if (members.length === 0) {
          doc.text('No members in this group.', margin, yPosition);
          return;
        }

        // Helper to abbreviate rank - improved
        const getRankAbbr = (fullRank: string): string => {
          const rank = fullRank.trim();
          
          // Exact phrase matches first
          const matches: { [key: string]: string } = {
            'Lieutenant Commander': 'LCDR',
            'Senior Chief Petty Officer': 'SCPO',
            'Chief Petty Officer': 'CPO',
            'Junior Petty Officer': 'JPO',
            'Petty Officer': 'PO',
            'Able Seaman': 'AB',
            'Seaman Apprentice': 'SA',
            'Rear Admiral': 'RADM',
          };
          
          if (matches[rank]) return matches[rank];
          
          // Partial matches
          if (rank.includes('Lieutenant Commander')) return 'LCDR';
          if (rank.includes('Senior Chief')) return 'SCPO';
          if (rank.includes('Chief Petty')) return 'CPO';
          if (rank.includes('Junior Petty')) return 'JPO';
          if (rank.includes('Petty Officer')) return 'PO';
          if (rank.includes('Able Seaman')) return 'AB';
          if (rank.includes('Seaman')) return 'Seaman';
          if (rank.includes('Midshipman')) return 'Mid';
          if (rank.includes('Commander')) return 'CDR';
          if (rank.includes('Captain')) return 'Capt';
          if (rank.includes('Deckhand')) return 'DH';
          if (rank.includes('Recruit')) return 'Rec';
          
          return rank.substring(0, 10);
        };

        // Helper to format notes with initials
        const formatNotesWithInitials = (slComment: string, cosComment: string): string[] => {
          const notes: string[] = [];
          if (slComment) notes.push(`SL: ${slComment}`);
          if (cosComment) notes.push(`CoS: ${cosComment}`);
          return notes;
        };

        const col = {
          rank: margin + 1,
          name: margin + 19,
          voy: margin + 53,
          host: margin + 73,
          notes: margin + 93,
        };

        // Header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Rank', col.rank, yPosition);
        doc.text('Name', col.name, yPosition);
        doc.text('Voyages', col.voy, yPosition);
        doc.text('Hosted', col.host, yPosition);
        doc.text('Notes', col.notes, yPosition);
        yPosition += 1;

        // Header underline
        doc.setDrawColor(100);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        doc.setLineWidth(0.2);
        yPosition += 6;

        // Data rows with borders
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        members.forEach((sailor) => {
          const abbr = getRankAbbr(sailor.rank);
          const noteLines = formatNotesWithInitials(sailor.squadLeaderComments || '', sailor.cosNotes || '');
          const rowHeight = Math.max(5, noteLines.length * 3.5 + 2);

          // Check if we need a page break
          if (yPosition + rowHeight + 1 > pageHeight - 15) {
            doc.addPage();
            yPosition = margin;
          }

          const rowStartY = yPosition;

          // Row data
          doc.text(abbr, col.rank, yPosition);
          doc.text(sailor.name.substring(0, 22), col.name, yPosition);
          doc.text(String(sailor.voyageCount), col.voy, yPosition);
          doc.text(String(sailor.hostCount), col.host, yPosition);

          // Notes with stacked format
          if (noteLines.length > 0) {
            doc.setFontSize(8);
            let noteY = yPosition;
            noteLines.forEach((line) => {
              doc.text(line, col.notes, noteY);
              noteY += 3.5;
            });
            doc.setFontSize(10);
          }

          yPosition += rowHeight;

          // Draw borders around the row
          doc.setDrawColor(180);
          doc.setLineWidth(0.2);
          
          // Left border
          doc.line(margin, rowStartY - 1, margin, yPosition);
          // Right border
          doc.line(pageWidth - margin, rowStartY - 1, pageWidth - margin, yPosition);
          // Bottom border
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          
          // Column dividers
          doc.line(col.name - 1, rowStartY - 1, col.name - 1, yPosition);
          doc.line(col.voy - 1, rowStartY - 1, col.voy - 1, yPosition);
          doc.line(col.host - 1, rowStartY - 1, col.host - 1, yPosition);
          doc.line(col.notes - 1, rowStartY - 1, col.notes - 1, yPosition);

          yPosition += 1;
        });

        // Bottom border for entire table
        doc.setDrawColor(100);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        doc.setLineWidth(0.2);
        yPosition += 4;
      };

      // ===== PAGE 1: COMMAND STAFF ROSTER =====
      drawSquadRoster('COMMAND STAFF', commandStaff, false);

      // ===== PAGE 1 CONTINUED: FIRST SQUAD ROSTER =====
      const squad1Label = squad1.length > 0 ? squad1[0].squad.toUpperCase() : 'SQUAD 1';
      drawSquadRoster(squad1Label, squad1, false);

      // ===== SHADE SQUAD (same page, directly after first squad) =====
      const squad2Label = squad2.length > 0 ? squad2[0].squad.toUpperCase() : 'SQUAD 2';
      drawSquadRoster(squad2Label, squad2, false);

      if (unassigned.length > 0) {
        drawSquadRoster('UNASSIGNED', unassigned, false);
      }

      // ===== CO NOTES =====
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
