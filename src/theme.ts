import { parseLocalStorage } from '@/helper/util';
import { atomWithStorage } from 'jotai/utils';
import { createTheme } from '@mui/material';

const { palette } = createTheme();

// theme
const mode = parseLocalStorage('mode', 'light');
const modeState = atomWithStorage<'light' | 'dark'>('mode', mode);

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    playerSplit: true;
    lg: true;
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
      sm: 600,
      md: 900,
      playerSplit: 1000,
      lg: 1280,
      xl: 1604,
      xxl: 1754,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
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
          '&.MuiFormLabel-root.Mui-disabled': mode == 'light' && {
            color: 'red !important',
          },
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
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& textarea.MuiInputBase-input.Mui-disabled': mode == 'light' && {
            color: palette.text.secondary,
            WebkitTextFillColor: palette.text.secondary,
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
