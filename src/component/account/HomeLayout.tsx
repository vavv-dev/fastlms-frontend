import { AccountGetUserByUsernameData, UserResponse, accountGetUserByUsername, accountUpdateMe } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { formatRelativeTime } from '@/helper/util';
import i18next from '@/i18n';
import { homeUserState, userState } from '@/store';
import EditIcon from '@mui/icons-material/Edit';
import { Avatar, Box, IconButton, Input, InputLabel, Stack, Tab, Tabs, Typography, useTheme } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

const t = (key: string) => i18next.t(key, { ns: 'account' });

const tabs: Array<Array<string>> = [
  [t('Home'), 'home'],
  [t('Video'), 'video'],
  [t('Short'), 'short'],
  [t('Playlist'), 'playlist'],
  [t('History'), 'history'],
  [t('Quiz'), 'quiz'],
  [t('Survey'), 'survey'],
  [t('Exam'), 'exam'],
  [t('Course'), 'course'],
  [t('Comment'), 'comment'],
  [t('Profile'), 'profile'],
];

const HomeLayout = () => {
  const { t } = useTranslation('account');
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { username } = useParams();
  const [user, setUser] = useAtom(userState);
  const [homeUser, setHomeUser] = useAtom(homeUserState);
  const { data, mutate } = useServiceImmutable<AccountGetUserByUsernameData, UserResponse>(accountGetUserByUsername, {
    username: username || '',
  });

  // current tab
  const tabIndex = tabs.findIndex(([, path]) => pathname.includes(`/u/${username}/${path}`));

  const changeAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const thumbnail = event.target.files?.[0];
    if (!thumbnail || !username) return;

    accountUpdateMe({
      formData: { thumbnail: thumbnail },
    }).then((update) => {
      setUser(update);
      mutate((prev: UserResponse | undefined) => ({ ...prev, ...update }), { revalidate: false });
    });
  };

  useEffect(() => {
    if (!data) return;
    setHomeUser(data);
  }, [data]); // eslint-disable-line

  useEffect(() => {
    if (tabIndex === -1) {
      navigate(`/u/${username}`, { replace: true });
    }
  }, [tabIndex]); // eslint-disable-line

  useEffect(() => {
    return () => {
      setHomeUser(null);
    };
  }, []); // eslint-disable-line

  // fix. flickering previous user's cache
  if (!homeUser || homeUser?.username != username) return null;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3,
          pb: 0,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: ((theme.mixins.toolbar.minHeight as number) || 0) - 80 - 36 * 2,
          zIndex: 4,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            maxWidth: 'sm',
            width: '100%',
            gap: 2,
            alignItems: homeUser.description ? 'flex-start' : 'center',
          }}
        >
          <Box sx={{ py: 1 }}>
            {homeUser.username != user?.username ? (
              <Avatar alt={homeUser.name} src={homeUser.thumbnail || ''} sx={{ width: 80, height: 80 }} />
            ) : (
              <InputLabel htmlFor="avatar-file" sx={{ position: 'relative' }}>
                <Input
                  onChange={changeAvatar}
                  inputProps={{ accept: 'image/*' }}
                  id="avatar-file"
                  type="file"
                  sx={{ display: 'none' }}
                />
                <IconButton component="span" sx={{ p: 0 }}>
                  <Avatar alt={homeUser.name} src={homeUser.thumbnail || ''} sx={{ width: 80, height: 80 }} />
                </IconButton>
                <Box sx={{ position: 'absolute', bottom: 0, right: 0, lineHeight: 1, cursor: 'pointer' }}>
                  <EditIcon />
                </Box>
              </InputLabel>
            )}
          </Box>
          <Stack>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              {homeUser.name}
            </Typography>
            <Typography variant="caption">
              {homeUser.username}
              {homeUser.created && ` • ${t(...formatRelativeTime(new Date(homeUser.created)))}`}
            </Typography>
            <Box dangerouslySetInnerHTML={{ __html: homeUser.description || '' }} />
          </Stack>
        </Box>
        <Box sx={{ maxWidth: '100%', mt: 2 }}>
          <Tabs
            selectionFollowsFocus
            sx={{ minHeight: 'unset' }}
            value={tabIndex === -1 ? 0 : tabIndex}
            role="navigation"
            variant="scrollable"
            scrollButtons={true}
            allowScrollButtonsMobile
          >
            {tabs.map(([title, path]) => (
              <Tab
                key={path}
                label={title}
                iconPosition="start"
                onClick={() => navigate(`/u/${username}/${path}`)}
                sx={{ minHeight: 'inherit', cursor: 'pointer', py: '12px', minWidth: 'unset' }}
              />
            ))}
          </Tabs>
        </Box>
      </Box>
      <Outlet />
    </>
  );
};

export default HomeLayout;
