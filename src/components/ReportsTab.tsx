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
import { parseAllCrewMembers } from '../services/dataParser';
import jsPDF from 'jspdf';

export const ReportsTab = () => {
  const { data } = useSheetData();
  const [coNotes, setCoNotes] = useState<string>('');

  // Get crew data directly from live sheet data
  const getCrew = () => {
    return parseAllCrewMembers(data.gullinbursti?.rows || []);
  };

  // Extract leaderboards from voyage awards sheet
  const getLeaderboards = () => {
    const voyageRows = data.voyageAwards.rows;

    if (!voyageRows || voyageRows.length === 0) {
      return { topHosts: [] as any[], topVoyagers: [] as any[] };
    }

    interface VoyageRow {
      name: string;
      hostCount: number;
      voyageCount: number;
    }

    const crewMap: Record<string, VoyageRow> = {};

    const crewNames = new Set<string>();
    data.gullinbursti.rows.forEach((row) => {
      const name = (row[data.gullinbursti.headers[1]] || '').trim();
      if (name && name !== 'Name') {
        crewNames.add(name);
      }
    });

    voyageRows.forEach((row) => {
      let matchedName = '';
      let hostCount = 0;
      let voyageCount = 0;

      Object.entries(row).forEach(([key, value]) => {
        const valueStr = (value || '').trim();

        if (!matchedName && crewNames.has(valueStr)) {
          matchedName = valueStr;
        }

        const keyLower = key.toLowerCase();
        if (keyLower.includes('host') && !isNaN(Number(value))) {
          hostCount = Math.max(hostCount, parseInt(value as string, 10) || 0);
        }

        if (keyLower.includes('voyage') && !isNaN(Number(value))) {
          voyageCount = Math.max(voyageCount, parseInt(value as string, 10) || 0);
        }
      });

      if (matchedName && (hostCount > 0 || voyageCount > 0)) {
        if (!crewMap[matchedName]) {
          crewMap[matchedName] = { name: matchedName, hostCount: 0, voyageCount: 0 };
        }
        crewMap[matchedName].hostCount = Math.max(crewMap[matchedName].hostCount, hostCount);
        crewMap[matchedName].voyageCount = Math.max(crewMap[matchedName].voyageCount, voyageCount);
      }
    });

    const crewArray = Object.values(crewMap).filter(c => c.name && c.name !== '-');

    const topHosts = crewArray
      .filter(c => c.hostCount > 0)
      .sort((a, b) => b.hostCount - a.hostCount)
      .slice(0, 5);

    const topVoyagers = crewArray
      .filter(c => c.voyageCount > 0)
      .sort((a, b) => b.voyageCount - a.voyageCount)
      .slice(0, 5);

    return { topHosts, topVoyagers };
  };

  // Generate PDF report using live data
  const generatePDF = (notes: string = '') => {
    try {
      const crew = getCrew();

      if (!crew || crew.length === 0) {
        alert('No crew data available for the report.');
        return;
      }

      const { topHosts, topVoyagers } = getLeaderboards();
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
      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      doc.text(`USS Gullinbursti - Report for ${monthName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Report Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      doc.setDrawColor(0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // ===== SHIP STATISTICS =====
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIP STATISTICS', margin, yPosition);
      yPosition += 7;

      const totalCrew = crew.length;
      const compliantCount = crew.filter(c => c.sailingCompliant).length;
      const complianceRate = totalCrew > 0 ? Math.round((compliantCount / totalCrew) * 100) : 0;
      const statText = `Total Members: ${totalCrew}  |  Sailing Compliant: ${compliantCount}  |  Compliance Rate: ${complianceRate}%`;
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

      const squadBreakdown: Record<string, number> = {};
      crew.forEach(m => {
        squadBreakdown[m.squad] = (squadBreakdown[m.squad] || 0) + 1;
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(squadBreakdown).forEach(([squad, count]) => {
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
      doc.setFont('helvetica', 'bold');
      doc.text('Rank', margin, yPosition);
      doc.text('Name', margin + 20, yPosition);
      doc.text('Squad', margin + 50, yPosition);
      doc.text('Status', margin + 85, yPosition);
      doc.text('Timezone', margin + 110, yPosition);
      yPosition += 5;

      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'normal');
      crew.forEach((sailor) => {
        addPageIfNeeded(5);
        doc.text(sailor.rank.substring(0, 8), margin, yPosition);
        doc.text(sailor.name.substring(0, 15), margin + 20, yPosition);
        doc.text(sailor.squad.substring(0, 12), margin + 50, yPosition);
        const status = sailor.loaStatus ? 'LOA' : (sailor.sailingCompliant ? 'Compliant' : 'Non-Compliant');
        doc.text(status.substring(0, 15), margin + 85, yPosition);
        doc.text(sailor.timezone.substring(0, 10), margin + 110, yPosition);
        yPosition += 4;
      });

      yPosition += 8;
      addPageIfNeeded(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('COMMANDING OFFICER NOTES', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesText = notes || 'No additional notes provided.';
      const splitNotes = doc.splitTextToSize(notesText, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 4 + 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('LCDR Hoit', margin, yPosition);
      yPosition += 4;
      doc.text('Commanding Officer', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128);
      doc.text('Generated by USN Ship Manager', margin, yPosition);
      yPosition += 4;
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, yPosition);

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
