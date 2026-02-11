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
  Tabs,
  Tab,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AnchorIcon from '@mui/icons-material/Anchor';
import { lightTheme, darkTheme } from './theme';
import { UsersTab } from './components/UsersTab';
import { OverviewTab } from './components/OverviewTab';
import { ActionsTab } from './components/ActionsTab';
import { ReportsTab } from './components/ReportsTab';
import { LinkedSheetsTab } from './components/LinkedSheetsTab';
import { SheetProvider } from './context/SheetDataContext';
import { VERSION_SHORT } from './version';
import './App.css';

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={0} sx={{ py: 3 }}>
        <Toolbar sx={{ flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', mb: 2 }}>
            <Box /> {/* Spacer for layout */}
            <Typography 
              variant="h3" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'bold',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                letterSpacing: '-0.5px',
              }}
            >
              <AnchorIcon sx={{ fontSize: 'inherit' }} />
              USN Ship Manager
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                opacity: 0.6,
                textAlign: 'right',
              }}
              title="Commit hash for reference"
            >
              v: {VERSION_SHORT}
            </Typography>
          </Box>
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
          <ReportsTab />
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
