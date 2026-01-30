import { createTheme } from '@mui/material/styles';

// Create a dynamic theme that adapts to system preferences
export const createAppTheme = (prefersDarkMode) => {
  return createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
      primary: {
        main: prefersDarkMode ? '#BB86FC' : '#6200EE',
        light: prefersDarkMode ? '#CFBCFF' : '#8E24AA',
        dark: prefersDarkMode ? '#8A5CF6' : '#3700B3',
      },
      secondary: {
        main: prefersDarkMode ? '#03DAC6' : '#018786',
        light: prefersDarkMode ? '#66FFF9' : '#4DB6AC',
        dark: prefersDarkMode ? '#00A896' : '#00695C',
      },
      error: {
        main: prefersDarkMode ? '#CF6679' : '#B00020',
      },
      warning: {
        main: prefersDarkMode ? '#FFB74D' : '#FF6F00',
      },
      info: {
        main: prefersDarkMode ? '#81D4FA' : '#0288D1',
      },
      success: {
        main: prefersDarkMode ? '#81C784' : '#388E3C',
      },
      background: {
        default: prefersDarkMode ? '#121212' : '#FFFBFE',
        paper: prefersDarkMode ? '#1E1E1E' : '#FFFFFF',
      },
      surface: {
        main: prefersDarkMode ? '#1E1E1E' : '#F7F2FA',
        variant: prefersDarkMode ? '#2A2A2A' : '#E7E0EC',
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 400,
        fontSize: '2.125rem',
        lineHeight: 1.235,
      },
      h6: {
        fontWeight: 500,
        fontSize: '1.25rem',
        lineHeight: 1.6,
      },
      body1: {
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            elevation: 1,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
};