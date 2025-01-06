import {
  BookmarkBorderOutlined,
  ChatOutlined,
  CloseOutlined,
  ContactMailOutlined,
  FiberSmartRecord,
  FileUploadOutlined,
  HistoryOutlined,
  NotificationsActiveOutlined,
  PeopleAltOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import { Avatar, Box, Fade, IconButton, Input, Link, Tab, Tabs, Theme, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';

import { accountUpdateMe } from '@/api';
import { snackbarMessageState, spacerRefState } from '@/component/layout';
import { notificationsState } from '@/component/notification';
import { formatRelativeTime, imageToBase64 } from '@/helper/util';
import { userState } from '@/store';

export const UserLayout = () => {
  const { t } = useTranslation('account');
  const [user, setUser] = useAtom(userState);
  const [hover, setHover] = useState(false);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const notifications = useAtomValue(notificationsState);

  // unread notification count
  const unReadCount = notifications.filter((n) => !n.read_time).length;

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement> | null) => {
    const image = e && e.target.files?.[0];
    if (e && !image) return;

    const max = 1;
    if (e && image && image.size > max * 1024 * 1024) {
      e.target.value = '';
      setSnackbarMessage({ message: t('File size must be less than {{ max }} MB.', { max }), duration: 3000 });
      return;
    }
    accountUpdateMe({ requestBody: { thumbnail: !e ? '' : await imageToBase64(image as File) } })
      .then((updated) => {
        setUser(updated);
      })
      .catch((error) => {
        setSnackbarMessage({ message: error.message, duration: 3000 });
      })
      .finally(() => {
        if (e) e.target.value = '';
      });
  };

  if (!user) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
          <Box
            sx={{
              mb: 5,
              display: 'flex',
              maxWidth: 'sm',
              width: '100%',
              gap: 2,
              alignItems: 'center',
              mx: 'auto',
              justifyContent: 'center',
            }}
          >
            <Box
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              component="label"
              htmlFor="thumbnail-image"
              sx={{ position: 'relative', cursor: 'pointer' }}
            >
              <Avatar alt={user.name} src={user.thumbnail || ''} sx={{ width: 60, height: 60 }} />
              <Fade in={hover || !user.thumbnail}>
                <Box sx={{ position: 'absolute', bottom: '-1em', left: 0, display: 'flex', alignItems: 'center', zIndex: 4 }}>
                  <Tooltip title={t('Upload thumbnail. 60 x 60 size recommended.')}>
                    <IconButton size="small" component="label" htmlFor="thumbnail-image" sx={{ p: 0.5 }}>
                      <FileUploadOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {user.thumbnail && (
                    <Tooltip title={t('Remove thumbnail')}>
                      <IconButton size="small" onClick={() => uploadImage(null)} sx={{ p: 0.5 }}>
                        <CloseOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Input
                    hidden
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => uploadImage(e)}
                    inputProps={{ accept: 'image/*' }}
                    id="thumbnail-image"
                    type="file"
                    sx={{ display: 'none' }}
                  />
                </Box>
              </Fade>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {user.name}
                <Typography variant="caption">
                  {user.username}
                  {user.created && ` • ${t(...formatRelativeTime(new Date(user.created)))}`}
                </Typography>
              </Typography>
              {user.description && <Typography variant="body2">{user.description}</Typography>}
            </Box>
          </Box>
          {!!unReadCount && (
            <Box sx={{ pb: 5, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
              <FiberSmartRecord color="error" />
              <Link to="/u/notification" component={RouterLink} underline="hover">
                {t('You have {{ val }} unread notifications.', { val: unReadCount > 10 ? t('more than 10') : unReadCount })}
              </Link>
            </Box>
          )}
        </Box>
        <Box sx={{ minWidth: { md: 180 } }} />
      </Box>
      <Box
        sx={{
          width: '100%',
          maxWidth: 'lg',
          display: 'flex',
          mx: 'auto',
          flexDirection: { xs: 'column', md: 'row-reverse' },
          '& > :first-of-type': { flexGrow: 0, flexShrink: 0 },
          '& > :last-child': { flexGrow: 1 },
          gap: 5,
        }}
      >
        <VerticalTabs />
        <Outlet />
      </Box>
    </Box>
  );
};

const VerticalTabs: React.FC = memo(() => {
  const { t } = useTranslation('account');
  const { pathname } = useLocation();
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const spacerRef = useAtomValue(spacerRefState);

  // update spacerRef height
  useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const tabs: [string, string, React.ElementType][] = useMemo(
    () => [
      [t('Course'), '', SchoolOutlined],
      [t('History'), 'history', HistoryOutlined],
      [t('Bookmark'), 'bookmark', BookmarkBorderOutlined],
      [t('Q&A/Comment'), 'comment', ChatOutlined],
      [t('Notification'), 'notification', NotificationsActiveOutlined],
      [t('Joined channel'), 'channel', PeopleAltOutlined],
      [t('Profile'), 'profile', ContactMailOutlined],
    ],
    [t],
  );

  const tabIndex = useMemo(() => {
    return tabs.findIndex(([, path]) => (path === '' ? pathname === '/u' : pathname.startsWith(`/u/${path}`)));
  }, [pathname, tabs]);

  const renderedTabs = useMemo(() => {
    return tabs.map(([title, path, Icon], i) => (
      <Tab
        key={path}
        component={RouterLink}
        to={`/u${path ? `/${path}` : ''}`}
        icon={<Icon fontSize="small" />}
        label={<Typography variant="body2">{title}</Typography>}
        iconPosition="start"
        sx={{
          bgcolor: i === tabIndex && !mdDown ? 'action.selected' : 'inherit',
          px: 3,
          minHeight: 'inherit',
          minWidth: 'unset',
          fontWeight: 700,
        }}
      />
    ));
  }, [tabIndex, mdDown, tabs]);

  return (
    <Tabs
      orientation={mdDown ? 'horizontal' : 'vertical'}
      selectionFollowsFocus
      value={tabIndex === -1 ? 0 : tabIndex}
      role="navigation"
      variant={mdDown ? 'scrollable' : 'standard'}
      scrollButtons
      allowScrollButtonsMobile
      sx={{
        position: 'sticky',
        bgcolor: 'background.paper',
        zIndex: 6,
        top: spacerRef?.clientHeight,
        minHeight: 'unset',
        maxWidth: '100%',
        alignSelf: { xs: 'center', md: 'flex-start' },
        '& .MuiButtonBase-root': { justifyContent: 'flex-start' },
        '& .MuiTabs-indicator': { left: 0, right: 'auto' },
        minWidth: { md: 180 },
        borderLeft: { md: 1 },
        borderColor: { md: 'divider' },
      }}
    >
      {renderedTabs}
    </Tabs>
  );
});
