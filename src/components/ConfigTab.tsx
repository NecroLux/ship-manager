import { Box, Card, CardContent, TextField, Button, Typography, Stack, Alert, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { useSheetData } from '../context/SheetDataContext';

export const ConfigTab = () => {
  const { ranges, updateSheetRange, refreshData, loading, error } = useSheetData();
  const [voyageRange, setVoyageRange] = useState(ranges.voyageAwards);
  const [gullinRange, setGullinRange] = useState(ranges.gullinbursti);
  const [roleCoinRange, setRoleCoinRange] = useState(ranges.roleCoin);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVoyageRange(ranges.voyageAwards);
    setGullinRange(ranges.gullinbursti);
    setRoleCoinRange(ranges.roleCoin);
  }, [ranges]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSheetRange('voyage-awards', voyageRange);
      await updateSheetRange('gullinbursti', gullinRange);
      await updateSheetRange('role-coin', roleCoinRange);
      await refreshData();
    } catch (err) {
      console.error('Error updating ranges:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        📋 Sheet Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          ℹ️ Update the Google Sheets ranges if crew data isn't loading properly.
        </Typography>
        <Typography variant="caption">
          Format: <code>Sheet Name!A1:Z99</code> (e.g., "Gullinbursti!A8:W49")
        </Typography>
      </Alert>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              📊 Voyage Awards
            </Typography>
            <TextField
              fullWidth
              label="Voyage Awards Range"
              value={voyageRange}
              onChange={(e) => setVoyageRange(e.target.value)}
              placeholder="Time/Voyage Awards!A1:AH34"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="textSecondary">
              Current: {ranges.voyageAwards}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              👥 Gullinbursti (Crew)
            </Typography>
            <TextField
              fullWidth
              label="Gullinbursti Range"
              value={gullinRange}
              onChange={(e) => setGullinRange(e.target.value)}
              placeholder="Gullinbursti!A8:W49"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="textSecondary">
              Current: {ranges.gullinbursti}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: '#ff9800' }}>
              ⚠️ If crew data isn't showing, try changing this range. Common options:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Gullinbursti!A1:Z99 (entire sheet)</li>
                <li>Gullinbursti!A8:W100 (extended range)</li>
                <li>Gullinbursti!A:Z (all data in columns A-Z)</li>
              </ul>
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              🎖️ Role/Coin Awards
            </Typography>
            <TextField
              fullWidth
              label="Role/Coin Range"
              value={roleCoinRange}
              onChange={(e) => setRoleCoinRange(e.target.value)}
              placeholder="Role/Coin Awards!A1:O34"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="textSecondary">
              Current: {ranges.roleCoin}
            </Typography>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={20} /> : undefined}
          >
            {saving ? 'Saving...' : 'Save & Reload'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => refreshData()}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Stack>

        <Card sx={{ backgroundColor: '#1e1e1e', borderLeft: '4px solid #ff9800' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              🔧 Troubleshooting
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>No crew data?</strong>
            </Typography>
            <ol style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
              <li>Open Google Sheet: Gullinbursti</li>
              <li>Find where crew names start (usually row 8+)</li>
              <li>Find the last column with data</li>
              <li>Enter range like: <code>Gullinbursti!A8:W100</code></li>
              <li>Click "Save & Reload"</li>
            </ol>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
