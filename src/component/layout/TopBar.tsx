import { modeState } from '@/theme';
import { ArrowBackIos, Brightness4, Brightness7 } from '@mui/icons-material';
import Menu from '@mui/icons-material/Menu';
import { Alert, AppBar, Box, Collapse, IconButton, Toolbar } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alertState, navState } from '.';
import { LoginButton } from './LoginButton';
import imgUrl from './assets/logo.svg';
import { NotificationButton } from './NotificationButton';

export const TopBar = ({ searchBar }: { searchBar?: React.ReactNode }) => {
  const [navOpen, setNavOpen] = useAtom(navState);
  const [themeMode, setThemeMode] = useAtom(modeState);
  const [alert, setAert] = useAtom(alertState);

  useEffect(() => {
    if (alert.open) {
      // auto close alert
      const timer = setTimeout(() => {
        setAert({ ...alert, open: false });
      }, alert.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, setAert]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" elevation={0} color="default" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={() => setNavOpen(!navOpen)} size="large" edge="start" color="inherit" aria-label="open drawer">
            {navOpen ? <ArrowBackIos /> : <Menu />}
          </IconButton>
          <Box component={Link} to="/" sx={{ display: 'flex', textDecoration: 'None', color: 'inherit' }}>
            <Box component="img" src={imgUrl} alt="logo" sx={{ height: 25 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {searchBar}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconButton onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}>
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <NotificationButton />
            <LoginButton />
          </Box>
        </Toolbar>
        <Collapse in={alert.open}>
          <Alert
            variant="filled"
            severity={alert.severity}
            sx={{ borderRadius: 0 }}
            onClose={alert.hideClose ? undefined : () => setAert({ ...alert, open: false })}
          >
            {alert.message}
          </Alert>
        </Collapse>
      </AppBar>
    </Box>
  );
};
