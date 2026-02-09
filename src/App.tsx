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
import { GoogleSheetsViewer } from './components/GoogleSheetsViewer';
import './App.css';

function App() {
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
            <Tab label="Dashboard" />
            <Tab label="Users" />
            <Tab label="Review" />
            <Tab label="Export" />
          </Tabs>
        </Box>

        {/* Dashboard Tab */}
        {activeTab === 0 && (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Dashboard Overview
              </Typography>
              <Typography color="textSecondary">
                Welcome to the Discord Member Dashboard. Use the tabs above to manage members, review data, and export reports.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Users Tab */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Import Discord Members
              </Typography>
              <Button variant="contained" color="primary" sx={{ mr: 2 }}>
                Import CSV
              </Button>
              <Button variant="outlined" color="secondary">
                Manual Entry
              </Button>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Members List
              </Typography>
              <Typography color="textSecondary">
                Members will appear here once imported.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Review Tab */}
        {activeTab === 2 && (
          <GoogleSheetsViewer 
            apiKey={(import.meta as any).env.VITE_GOOGLE_API_KEY}
          />
        )}

        {/* Export Tab */}
        {activeTab === 3 && (
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

export default App;
