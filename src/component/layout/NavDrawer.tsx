import {
  People,
  PeopleOutlined,
  SmartDisplay,
  SmartDisplayOutlined,
  SvgIconComponent,
  VideoCameraFront,
  VideoCameraFrontOutlined,
} from '@mui/icons-material';
import AssignmentInd from '@mui/icons-material/AssignmentInd';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import {
  Backdrop,
  Box,
  CSSObject,
  Collapse,
  Divider,
  DrawerProps,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer as MuiDrawer,
  Toolbar as Spacer,
  Theme,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { alertState, navState } from '.';
import { LanguageSelector } from './LanguageSelector';

import { userState } from '@/store';

const drawerWidth = 150;

type MenuItem = [string, string, SvgIconComponent, SvgIconComponent];

export const NavDrawer = ({ hideDrawer = false }: { hideDrawer?: boolean }) => {
  const { t } = useTranslation('layout');
  const user = useAtomValue(userState);
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const [navOpen, setNavOpen] = useAtom(navState);
  const alert = useAtomValue(alertState);

  const menus: MenuItem[] = useMemo(() => {
    const baseItems: MenuItem[] = [
      // [t('Home'), '', HomeOutlined, Home],
      [t('Video'), '', SmartDisplayOutlined, SmartDisplay],
      [t('Channel'), '/channel', PeopleOutlined, People],
      [t('Me'), '/u', AssignmentIndOutlined, AssignmentInd],
    ];
    return user?.use_channel
      ? [...baseItems, [t('My channel'), `/channel/${user.username}`, VideoCameraFrontOutlined, VideoCameraFront]]
      : baseItems;
  }, [user?.use_channel, user?.username, t]);

  useEffect(() => {
    if (hideDrawer) setNavOpen(false);
  }, [hideDrawer]); // eslint-disable-line

  useEffect(() => {
    if (mdDown) {
      setNavOpen(false);
    }
  }, [mdDown]); // eslint-disable-line

  return (
    <>
      {(mdDown || hideDrawer) && (navOpen || false) && (
        <Backdrop
          sx={{ zIndex: theme.zIndex.appBar - 2 }}
          open={(mdDown || hideDrawer) && (navOpen || false)}
          onClick={() => setNavOpen(false)}
        />
      )}
      <Drawer
        variant="permanent"
        open={navOpen}
        hideDrawer={hideDrawer}
        sx={{ position: { xs: 'absolute', md: hideDrawer ? 'absolute' : 'relative' } }}
      >
        <Spacer />
        <Collapse in={alert.open}>
          <Box sx={{ height: 48 }} />
        </Collapse>
        <List>
          {menus.map(([title, path, Icon, IconSeleted], i) => {
            if (!title) return <Divider key={i} />;
            const active =
              (path && (path == '/channel' ? pathname == path : pathname.startsWith(path))) || (!path && pathname == '/');

            return (
              <ListItem
                key={i}
                disablePadding
                onClick={() => {
                  navigate(path || '/');
                  if (mdDown) setNavOpen(false);
                }}
                sx={{ bgcolor: active ? theme.palette.action.selected : 'inherit' }}
              >
                <ListItemButton
                  sx={{ py: !navOpen ? 1.7 : 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {active ? <IconSeleted /> : <Icon />}
                    {!navOpen && (
                      <Typography
                        variant="caption"
                        sx={{ width: '60px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.2 }}
                      >
                        {title}
                      </Typography>
                    )}
                  </ListItemIcon>
                  {navOpen && <ListItemText primaryTypographyProps={{ fontSize: '.9em' }} primary={title} sx={{ ml: 1 }} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <ListItem disablePadding>
          <LanguageSelector
            renderTrigger={({ currentLanguage, onClick }) => (
              <ListItemButton
                onClick={onClick}
                sx={{ py: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <LanguageIcon />
                  {!navOpen && (
                    <Typography
                      variant="caption"
                      sx={{ width: '60px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.2 }}
                    >
                      {currentLanguage?.icon}
                    </Typography>
                  )}
                </ListItemIcon>
                {navOpen && (
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{currentLanguage?.label}</span>
                        <span>{currentLanguage?.icon}</span>
                      </Box>
                    }
                    primaryTypographyProps={{ fontSize: '.9em' }}
                    sx={{ ml: 1 }}
                  />
                )}
              </ListItemButton>
            )}
          />
        </ListItem>
      </Drawer>
    </>
  );
};

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme, hideDrawer: boolean): CSSObject => ({
  // do not use transition here, it will slow down the page navigation. eg video <-> home
  overflowX: 'hidden',
  width: 0,
  ...(!hideDrawer && {
    [theme.breakpoints.up('md')]: {
      width: `calc(${theme.spacing(8)} + 1px)`,
    },
  }),
});

interface DrawerWithHidePropProps extends DrawerProps {
  hideDrawer: boolean;
}

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'hideDrawer',
})<DrawerWithHidePropProps>(({ theme, open, hideDrawer }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme, hideDrawer),
    '& .MuiDrawer-paper': closedMixin(theme, hideDrawer),
  }),
  '& > .MuiDrawer-paper': {
    zIndex: theme.zIndex.appBar - 1,
    border: 'none',
  },
}));
