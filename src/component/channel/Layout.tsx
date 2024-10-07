import {
  ChannelDisplayResponse as DisplayResponse,
  channelGetChannelByUsername as getChannelByUsername,
  ChannelGetChannelByUsernameData as getChannelByUsernameData,
  channelGetDisplays as getDisplays,
  memberCreateMember as createMember,
  memberDeleteMember as deleteMember,
  accountUpdateMe as updateMe,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { formatRelativeTime, imageToBase64 } from '@/helper/util';
import i18next from '@/i18n';
import { homeUserState, userState } from '@/store';
import { CloseOutlined, FileUploadOutlined, Group } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  Fade,
  IconButton,
  Input,
  Stack,
  Tab,
  Tabs,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { snackbarMessageState, spacerRefState } from '../layout';

export const Layout = () => {
  const { t } = useTranslation('channel');
  const theme = useTheme();
  const { username } = useParams();
  const [user, setUser] = useAtom(userState);
  const [homeUser, setHomeUser] = useAtom(homeUserState);
  const { data, mutate } = useServiceImmutable<getChannelByUsernameData, DisplayResponse>(getChannelByUsername, {
    username: username || '',
  });
  const [avatarHover, setAvatarHover] = useState(false);
  const [bannerHover, setBannerHover] = useState(false);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement> | null, field: 'thumbnail' | 'banner') => {
    const image = e && e.target.files?.[0];
    if (e && !image) return;

    const max = field === 'thumbnail' ? 1 : 5;
    if (e && image && image.size > max * 1024 * 1024) {
      e.target.value = '';
      setSnackbarMessage({ message: t('File size must be less than {{ max }} MB.', { max }), duration: 3000 });
      return;
    }
    updateMe({ requestBody: { [field]: !e ? '' : await imageToBase64(image as File) } })
      .then((update) => {
        setUser(update);
        mutate((prev) => ({ ...prev, ...(update as DisplayResponse) }), { revalidate: false });
      })
      .catch((error) => {
        setSnackbarMessage({ message: error.message, duration: 3000 });
      })
      .finally(() => {
        if (e) e.target.value = '';
      });
  };

  const toggleMembership = (e: React.MouseEvent) => {
    if (!data || !user) return;
    e.stopPropagation();

    (data.member_id
      ? deleteMember({ id: data.member_id })
      : createMember({ requestBody: { channel_id: data.id, user_id: user.id } })
    ).then((created) => {
      updateInfiniteCache<DisplayResponse>(
        getDisplays,
        { id: data.id, member_id: created?.id, member_count: data.member_count + (created ? 1 : -1) },
        'update',
      );
      mutate(
        (prev) => {
          if (!prev) return prev;
          return { ...prev, member_id: created?.id || null, member_count: data.member_count + (created ? 1 : -1) };
        },
        { revalidate: false },
      );
    });
  };

  useEffect(() => {
    if (!data) return;
    setHomeUser(data);
  }, [data]); // eslint-disable-line

  useEffect(() => {
    return () => {
      setHomeUser(null);
    };
  }, []); // eslint-disable-line

  // fix. flickering previous user's cache
  if (!homeUser || homeUser?.username != username) return null;

  const isOwner = user?.username === homeUser.username;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 3,
          pt: 1,
          bgcolor: 'background.paper',
          zIndex: 4,
        }}
      >
        <Box
          onMouseEnter={() => setBannerHover(true)}
          onMouseLeave={() => setBannerHover(false)}
          sx={{ maxWidth: 'lg', width: '100%', position: 'relative' }}
        >
          {homeUser.banner && (
            <Box
              component="img"
              src={homeUser.banner}
              sx={{
                objectFit: 'cover',
                width: '100%',
                height: 'auto',
                aspectRatio: '6.2 / 1',
                borderRadius: theme.shape.borderRadius,
              }}
            />
          )}
          {isOwner && (
            <Fade in={bannerHover || !homeUser.banner}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  transform: 'translateY(100%)',
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 4,
                }}
              >
                <Tooltip title={t('Upload banner')}>
                  <IconButton size="small" component="label" htmlFor="banner-image">
                    <FileUploadOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!homeUser.banner && (
                  <Typography
                    component="label"
                    htmlFor="banner-image"
                    variant="caption"
                    sx={{ color: 'text.secondary', ml: 1, cursor: 'pointer' }}
                  >
                    {t('Upload banner')}
                  </Typography>
                )}
                {homeUser.banner && (
                  <Tooltip title={t('Remove banner')}>
                    <IconButton size="small" onClick={() => uploadImage(null, 'banner')}>
                      <CloseOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Input
                  hidden
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => uploadImage(e, 'banner')}
                  inputProps={{ accept: 'image/*' }}
                  id="banner-image"
                  type="file"
                  sx={{ display: 'none' }}
                />
              </Box>
            </Fade>
          )}
        </Box>

        <Box
          sx={{
            py: 2,
            display: 'flex',
            maxWidth: 'sm',
            width: '100%',
            gap: 2,
            alignItems: homeUser.description ? 'flex-start' : 'center',
          }}
        >
          <Box
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            sx={{ position: 'relative' }}
            {...(isOwner && { component: 'label', htmlFor: 'thumbnail-image', sx: { position: 'relative', cursor: 'pointer' } })}
          >
            <Avatar alt={homeUser.name} src={homeUser.thumbnail || ''} sx={{ width: 100, height: 100 }} />
            {isOwner && (
              <Fade in={avatarHover || !homeUser.thumbnail}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '-1em',
                    left: 0,
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 4,
                  }}
                >
                  <Tooltip title={t('Upload thumbnail')}>
                    <IconButton size="small" component="label" htmlFor="thumbnail-image" sx={{ p: 0.5 }}>
                      <FileUploadOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {homeUser.thumbnail && (
                    <Tooltip title={t('Remove thumbnail')}>
                      <IconButton size="small" onClick={() => uploadImage(null, 'thumbnail')} sx={{ p: 0.5 }}>
                        <CloseOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Input
                    hidden
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => uploadImage(e, 'thumbnail')}
                    inputProps={{ accept: 'image/*' }}
                    id="thumbnail-image"
                    type="file"
                    sx={{ display: 'none' }}
                  />
                </Box>
              </Fade>
            )}
          </Box>
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              {homeUser.name}
              <Typography variant="caption">
                {homeUser.username}
                {homeUser.created && ` • ${t(...formatRelativeTime(new Date(homeUser.created)))}`}
                {data && !!data.member_count && ` • ${t('Member {{ num }}', { num: data.member_count.toLocaleString() })}`}
              </Typography>
              {!isOwner && data && (
                <Tooltip title={data.member_id ? t('Member leave') : t('Member join')}>
                  <Chip
                    onClick={toggleMembership}
                    size="small"
                    icon={<Group />}
                    color={data.member_id ? 'primary' : 'default'}
                    label={data.member_id ? t('Joined') : t('Join')}
                  />
                </Tooltip>
              )}
            </Typography>
            <Box
              sx={{ fontSize: theme.typography.body2.fontSize }}
              dangerouslySetInnerHTML={{ __html: homeUser.description || '' }}
            />
          </Stack>
        </Box>
      </Box>
      <HomeTabs />
      <Outlet />
    </>
  );
};

const t = (key: string) => i18next.t(key, { ns: 'channel' });

const tabs: Array<Array<string>> = [
  [t('Home'), ''],
  [t('Video'), 'video'],
  [t('Short'), 'short'],
  [t('Playlist'), 'playlist'],
  [t("Asset"), 'asset'],
  [t('Quiz'), 'quiz'],
  [t('Survey'), 'survey'],
  [t('Exam'), 'exam'],
  [t('Lesson'), 'lesson'],
  [t('Course'), 'course'],
  [t('Comment'), 'comment'],
  [t('Member'), 'member'],
];

const privateTabs: Array<string> = ['member'];

const HomeTabs = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const spacerRef = useAtomValue(spacerRefState);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isFixed, setIsFixed] = useState(false);
  const lastScrollY = useRef(0);
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);

  // update spacerRef height
  useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  // current tab
  const tabIndex = tabs.findIndex(([, path]) => {
    return path === '' ? pathname === `/channel/${username}` : pathname.startsWith(`/channel/${username}/${path}`);
  });

  useEffect(() => {
    if (tabIndex === -1) {
      navigate(`/channel/${username}`, { replace: true });
    }
  }, [tabIndex, navigate, username]);

  // stick no bouncing tabs
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current && spacerRef) {
        const tabsRect = tabsRef.current.getBoundingClientRect();
        const spacerHeight = spacerRef.clientHeight;
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY.current) {
          // Scrolling down
          if (tabsRect.top <= spacerHeight) {
            setIsFixed(true);
          }
        } else {
          // Scrolling up
          if (tabsRect.top > spacerHeight || currentScrollY <= spacerHeight) {
            setIsFixed(false);
          }
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [spacerRef]);

  const isOwner = user && user.username === homeUser?.username;

  return (
    <Box
      ref={tabsRef}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center',
        position: isFixed ? 'fixed' : 'sticky',
        top: spacerRef?.clientHeight,
        zIndex: 6,
        bgcolor: 'background.paper',
        width: ['100%', '-moz-available', '-webkit-fill-available', 'fill-available'],
      }}
    >
      <Tabs
        selectionFollowsFocus
        value={tabIndex === -1 ? 0 : tabIndex}
        role="navigation"
        variant="scrollable"
        scrollButtons={true}
        allowScrollButtonsMobile
        sx={{ minHeight: 'unset', maxWidth: '100%' }}
      >
        {tabs
          .filter(([, path]) => isOwner || !privateTabs.includes(path))
          .map(([title, path]) => (
            <Tab
              key={path}
              label={title}
              iconPosition="start"
              onClick={() => navigate(`/channel/${username}${path ? `/${path}` : ''}`)}
              sx={{ minHeight: 'inherit', cursor: 'pointer', py: '12px', minWidth: 'unset', fontWeight: 700 }}
            />
          ))}
      </Tabs>
    </Box>
  );
};
