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
        addPageIfNeeded(20);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += 2;
        doc.setDrawColor(100);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      };

      // Helper: draw a stat line
      const drawStatLine = (label: string, value: string | number) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${label}: ${value}`, margin + 5, yPosition);
        yPosition += 5;
      };

      // ===== PAGE 1: HEADER =====
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTHLY SHIP REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      doc.text(`USS Gullinbursti \u2014 ${monthName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.setFontSize(10);
      doc.text(`Report Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setLineWidth(0.2);
      yPosition += 8;

      // ===== SHIP STATISTICS (matches Overview cards) =====
      drawSectionTitle('SHIP STATISTICS');

      drawStatLine('Total Members', totalCrew);
      drawStatLine('Sailing Compliant (incl. LOA)', compliantCount);
      drawStatLine('Attention Required', attentionCount);
      drawStatLine('Compliance Rate', `${complianceRate}%`);
      yPosition += 8;

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
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${sg.label}: ${sg.members.length} members (${sgRate}% compliant)`, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 8;

      // ===== CREW ROSTER — SPLIT BY SQUAD =====

      const drawSquadRoster = (title: string, members: typeof enrichedCrew, startNewPage: boolean = false) => {
        if (startNewPage) {
          doc.addPage();
          yPosition = margin;
        } else {
          yPosition += 8; // Line break before each roster
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
          doc.text('No members in this group.', margin + 5, yPosition);
          yPosition += 5;
          return;
        }

        // Table header — matches Crew tab columns:
        // Rank | Name | Status | Sailing | Voyages | Hosted | TZ | Activity
        const colX = {
          rank: margin,
          name: margin + 32,
          status: margin + 62,
          sailing: margin + 85,
          voyages: margin + 105,
          hosted: margin + 122,
          tz: margin + 138,
          activity: margin + 155,
        };

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Rank', colX.rank, yPosition);
        doc.text('Name', colX.name, yPosition);
        doc.text('Voyages', colX.voyages, yPosition);
        doc.text('Hosted', colX.hosted, yPosition);
        yPosition += 2;

        doc.setDrawColor(180);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        members.forEach((sailor) => {
          addPageIfNeeded(10);

          // Rank (truncated)
          doc.text(sailor.rank.substring(0, 18), colX.rank, yPosition);

          // Name
          doc.text(sailor.name.substring(0, 16), colX.name, yPosition);

          // Voyages & Hosted
          doc.text(String(sailor.voyageCount), colX.voyages, yPosition);
          doc.text(String(sailor.hostCount), colX.hosted, yPosition);

          yPosition += 4.5;
        });
      };

      // ===== PAGE 2: COMMAND STAFF + SQUAD ROSTERS =====
      drawSquadRoster('COMMAND STAFF', commandStaff, true);

      const squad1Label = squad1.length > 0 ? squad1[0].squad.toUpperCase() : 'SQUAD 1';
      drawSquadRoster(squad1Label, squad1, false);

      const squad2Label = squad2.length > 0 ? squad2[0].squad.toUpperCase() : 'SQUAD 2';
      drawSquadRoster(squad2Label, squad2, false);

      if (unassigned.length > 0) {
        drawSquadRoster('UNASSIGNED', unassigned, false);
      }

      // ===== SAILOR NOTES =====
      doc.addPage();
      yPosition = margin;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SAILOR NOTES', margin, yPosition);
      yPosition += 2;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setLineWidth(0.2);
      yPosition += 8;

      // Display notes for each sailor that has them
      const sailorsWithNotes = enrichedCrew.filter((s) => s.squadLeaderComments || s.cosNotes);
      
      if (sailorsWithNotes.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        sailorsWithNotes.forEach((sailor) => {
          addPageIfNeeded(12);
          
          // Sailor name and rank
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`${sailor.rank} ${sailor.name}`, margin, yPosition);
          yPosition += 4;
          
          // Squad Leader Comments
          if (sailor.squadLeaderComments) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('Squad Leader:', margin + 3, yPosition);
            yPosition += 3;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const slNotes = doc.splitTextToSize(sailor.squadLeaderComments, contentWidth - 6);
            doc.text(slNotes, margin + 6, yPosition);
            yPosition += slNotes.length * 3 + 2;
          }
          
          // Chief of Ship Notes
          if (sailor.cosNotes) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('Chief of Ship:', margin + 3, yPosition);
            yPosition += 3;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const cosNotesText = doc.splitTextToSize(sailor.cosNotes, contentWidth - 6);
            doc.text(cosNotesText, margin + 6, yPosition);
            yPosition += cosNotesText.length * 3 + 4;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('No sailor notes recorded.', margin, yPosition);
        yPosition += 5;
      }

      // ===== CO NOTES (final page) =====
      doc.addPage();
      yPosition = margin;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COMMANDING OFFICER NOTES', margin, yPosition);
      yPosition += 2;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setLineWidth(0.2);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesText = notes || 'No additional notes provided.';
      const splitNotes = doc.splitTextToSize(notesText, contentWidth);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 5 + 10;

      // Signature
      addPageIfNeeded(30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('LCDR Hoit', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.text('Commanding Officer, USS Gullinbursti', margin, yPosition);
      yPosition += 12;

      // Footer
      doc.setFontSize(8);
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
