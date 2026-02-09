import { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { lightTheme, darkTheme } from './theme';
import { UsersTab } from './components/UsersTab';
import { OverviewTab } from './components/OverviewTab';
import { ActionsTab } from './components/ActionsTab';
import { LinkedSheetsTab } from './components/LinkedSheetsTab';
import { SheetProvider } from './context/SheetDataContext';
import './App.css';

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={0} sx={{ py: 3 }}>
        <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              letterSpacing: '-0.5px',
              mb: 2,
              width: '100%'
            }}
          >
            USN Ship Manager
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
            <IconButton
              color="inherit"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTabs-flexContainer': {
                justifyContent: 'space-around',
              }
            }}
          >
            <Tab label="Overview" sx={{ flex: 1 }} />
            <Tab label="Crew" sx={{ flex: 1 }} />
            <Tab label="Actions" sx={{ flex: 1 }} />
            <Tab label="Reports" sx={{ flex: 1 }} />
            <Tab label="Config" sx={{ flex: 1 }} />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <OverviewTab />
        )}

        {/* Sailors Tab */}
        {activeTab === 1 && (
          <UsersTab />
        )}

        {/* Actions Tab */}
        {activeTab === 2 && (
          <ActionsTab />
        )}

        {/* Reports Tab */}
        {activeTab === 3 && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Ship Report */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ship Report
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Generate a comprehensive report of all crew members and their status.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="primary" size="small">
                    Download Word
                  </Button>
                  <Button variant="contained" color="info" size="small">
                    Download PDF
                  </Button>
                </Box>
              </Paper>

              {/* Squad Report */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Squad Report
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Generate squad-specific reports with member details and metrics.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="primary" size="small">
                    Download Word
                  </Button>
                  <Button variant="contained" color="info" size="small">
                    Download PDF
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {/* Config Tab */}
        {activeTab === 4 && (
          <LinkedSheetsTab />
        )}
      </Container>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SheetProvider>
      <AppContent />
    </SheetProvider>
  );
}

export default App;
