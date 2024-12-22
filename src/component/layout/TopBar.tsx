import { Brightness4, Brightness7, LiveHelpOutlined, MenuOpen } from '@mui/icons-material';
import Menu from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Theme, Toolbar, Tooltip, useMediaQuery } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { navState } from '.';
import { GlobalAlert } from './GlobalAlert';
import { LanguageSelector } from './LanguageSelector';

import { LoginButton } from '@/component/account';
import { chatDrawerState } from '@/component/chat';
import { NotificationBox } from '@/component/notification';
import { userState } from '@/store';
import { modeState } from '@/theme';

const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED == 'true';

export const TopBar = ({ searchBar }: { searchBar?: React.ReactNode }) => {
  const { t } = useTranslation('layout');
  const [navOpen, setNavOpen] = useAtom(navState);
  const [themeMode, setThemeMode] = useAtom(modeState);
  const user = useAtomValue(userState);
  const setChatDrawerOpen = useSetAtom(chatDrawerState);
  const mobileDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('mobile'));

  // logo path
  const logoPath = `/asset/logo-${themeMode}-25.png`;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" elevation={0} color="default" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={() => setNavOpen(!navOpen)} size="large" edge="start" color="inherit" aria-label="open drawer">
            {navOpen ? <MenuOpen /> : <Menu />}
          </IconButton>
          {!mobileDown && (
            <Box component={Link} to="/" sx={{ display: 'flex', textDecoration: 'None', color: 'inherit' }}>
              <Box component="img" src={logoPath} alt="logo" sx={{ height: 25, width: 100 }} />
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {searchBar}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.6 } }}>
            {AI_CHAT_ENABLED && user && (
              <Tooltip title={t('AI help')}>
                <IconButton onClick={() => setChatDrawerOpen(true)}>
                  <LiveHelpOutlined />
                </IconButton>
              </Tooltip>
            )}
            <NotificationBox />
            {!user && <LanguageSelector />}
            <IconButton onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}>
              {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <LoginButton />
          </Box>
        </Toolbar>
        <GlobalAlert />
      </AppBar>
    </Box>
  );
};
