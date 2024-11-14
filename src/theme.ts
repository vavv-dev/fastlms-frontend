import { createTheme } from '@mui/material';
import { atomWithStorage } from 'jotai/utils';

import { parseLocalStorage } from '@/helper/util';

const { palette } = createTheme();

// theme
const mode = parseLocalStorage('mode', 'light');
const modeState = atomWithStorage<'light' | 'dark'>('mode', mode);

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    mobile: true;
    sm: true;
    smm: true;
    md: true;
    mdl: true;
    lg: true;
    lgx: true;
    xl: true;
    xxl: true;
  }
  interface Palette {
    colorList: string[];
  }
}

const themeConfig = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    colorList: ['#FF5722', '#03A9F4', '#8BC34A', '#E91E63', '#FFC107', '#9C27B0', '#FF9800', '#00BCD4', '#CDDC39', '#673AB7'],
  },
  breakpoints: {
    values: {
      xs: 0,
      mobile: 431,
      sm: 600,
      smm: 700,
      md: 900,
      mdl: 1000,
      lg: 1280,
      lgx: 1440,
      xl: 1604,
      xxl: 1754,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '.mui-decoded-url': {
          color: '#1976d2', // MUI primary color
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          wordBreak: 'keep-all',
        },
      },
    } as const,
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        } as const,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        } as const,
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.MuiFormLabel-root.Mui-disabled': mode == 'light' && {
            color: palette.text.secondary,
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          '& .MuiFormControlLabel-label.Mui-disabled': mode == 'light' && {
            color: palette.text.secondary,
          },
          '& .MuiFormControlLabel-label': {
            lineHeight: 1.2,
            paddingTop: 4,
            paddingBottom: 4,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          lineHeight: 1.2,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& textarea.MuiInputBase-input.Mui-disabled': mode == 'light' && {
            color: palette.text.secondary,
            WebkitTextFillColor: palette.text.secondary,
          },
        },
        input: {
          '&::placeholder': {
            textOverflow: 'ellipsis',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        option: {
          whiteSpace: 'nowrap',
        },
      },
    },
  },
});

export { modeState, themeConfig };
