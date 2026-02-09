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
import { DashboardTab } from './components/DashboardTab';
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
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Discord Member Dashboard
          </Typography>
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
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)}>
            <Tab label="Overview" />
            <Tab label="Dashboard" />
            <Tab label="Users" />
            <Tab label="Actions" />
            <Tab label="Linked Sheets" />
            <Tab label="Export" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <OverviewTab />
        )}

        {/* Dashboard Tab */}
        {activeTab === 1 && (
          <DashboardTab />
        )}

        {/* Users Tab */}
        {activeTab === 2 && (
          <UsersTab />
        )}

        {/* Actions Tab */}
        {activeTab === 3 && (
          <ActionsTab />
        )}

        {/* Linked Sheets Tab */}
        {activeTab === 4 && (
          <LinkedSheetsTab />
        )}

        {/* Export Tab */}
        {activeTab === 5 && (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Export Report
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="info" sx={{ mr: 2 }}>
                  Export PDF
                </Button>
                <Button variant="contained" color="secondary" sx={{ mr: 2 }}>
                  Export Excel
                </Button>
                <Button variant="contained" color="primary">
                  Export Word
                </Button>
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                Export your member data in multiple formats.
              </Typography>
            </Paper>
          </Box>
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
