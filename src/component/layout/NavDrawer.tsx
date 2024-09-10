import { userState } from '@/store';
import {
  FactCheck,
  FactCheckOutlined,
  HomeOutlined,
  PeopleAlt,
  PeopleAltOutlined,
  Poll,
  PollOutlined,
  Quiz,
  QuizOutlined,
  School,
  SchoolOutlined,
} from '@mui/icons-material';
import AssignmentInd from '@mui/icons-material/AssignmentInd';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import Home from '@mui/icons-material/Home';
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

const drawerWidth = 150;

export const NavDrawer = ({ hideDrawer = false }: { hideDrawer?: boolean }) => {
  const { t } = useTranslation('layout');
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const matches = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const user = useAtomValue(userState);
  const [navOpen, setNavOpen] = useAtom(navState);
  const alert = useAtomValue(alertState);

  const menuItems: [string, string, React.ElementType, React.ElementType][] = useMemo(
    () => [
      [t('Home'), '', HomeOutlined, Home],
      [t('Channel'), '/channel', PeopleAltOutlined, PeopleAlt],
      [t('Quiz'), '/quiz', QuizOutlined, Quiz],
      [t('Survey'), '/survey', PollOutlined, Poll],
      [t('Exam'), '/exam', FactCheckOutlined, FactCheck],
      [t('Course'), '/course', SchoolOutlined, School],
      [t('Me'), `/u/${user?.username}`, AssignmentIndOutlined, AssignmentInd],
    ],
    [user, t],
  ); // eslint-disable-line,

  useEffect(() => {
    if (hideDrawer) setNavOpen(false);
  }, [hideDrawer]); // eslint-disable-line

  useEffect(() => {
    if (matches) {
      setNavOpen(false);
    }
  }, [matches]); // eslint-disable-line

  return (
    <>
      {(matches || hideDrawer) && (navOpen || false) && (
        <Backdrop
          sx={{ zIndex: theme.zIndex.appBar - 2 }}
          open={(matches || hideDrawer) && (navOpen || false)}
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
          {menuItems.map(([title, path, Icon, IconSeleted], i) => {
            const active = (path && pathname.startsWith(path)) || (!path && pathname == '/');
            return title ? (
              <ListItem
                key={i}
                disablePadding
                onClick={() => {
                  navigate(path || '/');
                  if (matches) setNavOpen(false);
                }}
                sx={active ? { bgcolor: theme.palette.action.hover } : {}}
              >
                <ListItemButton sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ListItemIcon
                    sx={{ color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}
                  >
                    {active ? <IconSeleted /> : <Icon />}
                    {!navOpen && <Typography variant="caption">{title}</Typography>}
                  </ListItemIcon>
                  {navOpen && (
                    <ListItemText
                      primaryTypographyProps={{ fontSize: '.9em' }}
                      primary={title}
                      sx={{ opacity: navOpen ? 1 : 0 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ) : (
              <Divider key={i} />
            );
          })}
        </List>
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
  // transition: theme.transitions.create('width', {
  //   easing: theme.transitions.easing.sharp,
  //   duration: theme.transitions.duration.leavingScreen,
  // }),
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
  // '>' required not to override the .MuiDrawer-paper accidentally
  '& > .MuiDrawer-paper': {
    zIndex: theme.zIndex.appBar - 1,
    border: 'none',
  },
}));
