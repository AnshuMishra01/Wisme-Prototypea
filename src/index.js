import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/components.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create a custom theme with Wizzy's colors
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7855c0', // Wizzy purple
      light: '#9173d9',
      dark: '#6344a8',
    },
    secondary: {
      main: '#FFB74D', // Wizzy orange
      light: '#FFCC80',
      dark: '#FFA726',
    },
    background: {
      default: '#f8f6ff', // Light lavender background
      paper: '#ffffff', // White
    },
    text: {
      primary: '#333333', // Dark grey
      secondary: '#666666', // Medium grey
    },
  },
  typography: {
    fontFamily: [
      'Circular',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);