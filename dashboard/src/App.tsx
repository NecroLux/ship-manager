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
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { lightTheme, darkTheme } from './theme';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);

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
      <Container maxWidth="md" sx={{ mt: 4 }}>
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
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Google Sheets Integration
          </Typography>
          <Button variant="contained" color="success" sx={{ mr: 2 }}>
            Read Sheets
          </Button>
          <Button variant="contained" color="warning">
            Update Sheets
          </Button>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Export Report
          </Typography>
          <Box>
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
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
