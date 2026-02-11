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
  getTopHosts as getTopHostsFromParser,
  getTopVoyagers as getTopVoyagersFromParser,
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
      const topHosts = leaderboardData.length > 0 ? getTopHostsFromParser(leaderboardData, 10) : [];
      const topVoyagers = leaderboardData.length > 0 ? getTopVoyagersFromParser(leaderboardData, 10) : [];

      // Enrich crew with voyage/host counts (same as Crew tab)
      const enrichedCrew = crew.map((m) => enrichCrewWithLeaderboardData(m, leaderboardData));

      // Split into squad groups
      const commandStaff = enrichedCrew.filter((m) => m.squad === 'Command Staff');
      const squad1 = enrichedCrew.filter((m) => m.squad !== 'Command Staff' && m.squad !== 'Unassigned' && !m.squad.toLowerCase().includes('shade'));
      const squad2 = enrichedCrew.filter((m) => m.squad.toLowerCase().includes('shade'));
      const unassigned = enrichedCrew.filter((m) => m.squad === 'Unassigned');

      // Stats matching Overview tab: compliant = sailingCompliant || loaStatus
      const totalCrew = crew.length;
      const compliantCount = enrichedCrew.filter((c) => c.sailingCompliant || c.loaStatus).length;
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
        const sgCompliant = sg.members.filter((m) => m.sailingCompliant || m.loaStatus).length;
        const sgRate = sg.members.length > 0 ? Math.round((sgCompliant / sg.members.length) * 100) : 0;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${sg.label}: ${sg.members.length} members (${sgRate}% compliant)`, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 3;

      // ===== TOP 10 HOSTS (matches Overview) =====
      drawSectionTitle('TOP 10 SHIP HOSTS');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (topHosts.length > 0) {
        topHosts.forEach((s, idx) => {
          addPageIfNeeded(5);
          const numStr = `${idx + 1}.`.padEnd(4);
          doc.text(`${numStr}${s.name} \u2014 ${s.hostCount} hosted`, margin + 5, yPosition);
          yPosition += 5;
        });
      } else {
        doc.text('No hosting data available', margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // ===== TOP 10 VOYAGERS (matches Overview) =====
      drawSectionTitle('TOP 10 SHIP VOYAGERS');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (topVoyagers.length > 0) {
        topVoyagers.forEach((s, idx) => {
          addPageIfNeeded(5);
          const numStr = `${idx + 1}.`.padEnd(4);
          doc.text(`${numStr}${s.name} \u2014 ${s.voyageCount} voyages`, margin + 5, yPosition);
          yPosition += 5;
        });
      } else {
        doc.text('No voyage data available', margin + 5, yPosition);
        yPosition += 5;
      }

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
          name: margin + 22,
          status: margin + 52,
          sailing: margin + 75,
          voyages: margin + 95,
          hosted: margin + 115,
          tz: margin + 133,
          activity: margin + 155,
        };

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Rank', colX.rank, yPosition);
        doc.text('Name', colX.name, yPosition);
        doc.text('Status', colX.status, yPosition);
        doc.text('Sailing', colX.sailing, yPosition);
        doc.text('Voyages', colX.voyages, yPosition);
        doc.text('Hosted', colX.hosted, yPosition);
        doc.text('TZ', colX.tz, yPosition);
        doc.text('Chat', colX.activity, yPosition);
        yPosition += 2;

        doc.setDrawColor(180);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        members.forEach((sailor) => {
          addPageIfNeeded(6);

          // Rank (truncated)
          doc.text(sailor.rank.substring(0, 12), colX.rank, yPosition);

          // Name
          doc.text(sailor.name.substring(0, 16), colX.name, yPosition);

          // Status (Active / LOA-1 / LOA-2 / Flagged)
          const loaRaw = (sailor.complianceStatus || '').trim().toLowerCase();
          let statusLabel = 'Active';
          if (loaRaw.includes('loa')) statusLabel = sailor.complianceStatus.toUpperCase().trim();
          else if (loaRaw === 'flagged' || loaRaw === 'non-compliant' || loaRaw === 'requires action') statusLabel = 'Flagged';
          doc.text(statusLabel.substring(0, 10), colX.status, yPosition);

          // Sailing compliance
          const sailingLabel = sailor.loaStatus ? 'Exempt' : (sailor.sailingCompliant ? 'Yes' : 'No');
          doc.text(sailingLabel, colX.sailing, yPosition);

          // Voyages & Hosted
          doc.text(String(sailor.voyageCount), colX.voyages, yPosition);
          doc.text(String(sailor.hostCount), colX.hosted, yPosition);

          // Timezone
          doc.text((sailor.timezone || '-').replace(/\s*\(.*?\)/, '').substring(0, 8), colX.tz, yPosition);

          // Chat activity (stars as number /5)
          doc.text(`${sailor.chatActivity}/5`, colX.activity, yPosition);

          yPosition += 4.5;
        });
      };

      // ===== PAGE 1 (continued): COMMAND STAFF at bottom of page 1 =====
      drawSquadRoster('COMMAND STAFF', commandStaff, false);

      // ===== PAGE 2: BOTH SQUAD ROSTERS =====
      const squad1Label = squad1.length > 0 ? squad1[0].squad.toUpperCase() : 'SQUAD 1';
      drawSquadRoster(squad1Label, squad1, true);

      const squad2Label = squad2.length > 0 ? squad2[0].squad.toUpperCase() : 'SQUAD 2';
      drawSquadRoster(squad2Label, squad2, false);

      if (unassigned.length > 0) {
        drawSquadRoster('UNASSIGNED', unassigned, false);
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
