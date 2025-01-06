import { CloseOutlined, ErrorOutlined, FileUploadOutlined, Group } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  ChannelDisplayResponse as DisplayResponse,
  memberCreateMember as createMember,
  memberDeleteMember as deleteMember,
  channelGetChannelByUsername as getChannelByUsername,
  ChannelGetChannelByUsernameData as getChannelByUsernameData,
  channelGetDisplays as getDisplays,
  channelUpdateMyChannel as updateMyChannel,
} from '@/api';
import { EmptyMessage, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { snackbarMessageState, spacerRefState } from '@/component/layout';
import { decodeURLText, formatRelativeTime, imageToBase64 } from '@/helper/util';
import { channelState, userState } from '@/store';

export const Layout = () => {
  const { t } = useTranslation('channel');
  const theme = useTheme();
  const navigate = useNavigate();
  const { username } = useParams();
  const user = useAtomValue(userState);
  const [channel, setChannel] = useAtom(channelState);
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
    updateMyChannel({ requestBody: { [field]: !e ? '' : await imageToBase64(image as File) } })
      .then((updated) => {
        mutate((prev) => prev && { ...prev, ...updated }, { revalidate: false });
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
    setChannel(data);
  }, [data]); // eslint-disable-line

  useEffect(() => {
    return () => {
      setChannel(null);
    };
  }, []); // eslint-disable-line

  // fix. flickering previous user's cache
  if (!channel || channel?.owner.username != username) return null;

  if (!channel.owner.use_channel) {
    return <EmptyMessage Icon={ErrorOutlined} message={t('This channel is not active.')} />;
  }

  const isOwner = user?.username === channel.owner.username;

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
          {channel.banner && (
            <Box
              component="img"
              src={channel.banner}
              sx={{
                objectFit: 'cover',
                width: '100%',
                height: 'auto',
                aspectRatio: '6.4 / 1',
                borderRadius: theme.shape.borderRadius,
              }}
            />
          )}
          {isOwner && (
            <Fade in={bannerHover || !channel.banner}>
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
                <Tooltip title={t('Upload banner. 1280 x 200 size is recommended.')}>
                  <IconButton size="small" component="label" htmlFor="banner-image">
                    <FileUploadOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!channel.banner && (
                  <Typography
                    component="label"
                    htmlFor="banner-image"
                    variant="caption"
                    sx={{ color: 'text.secondary', ml: 1, cursor: 'pointer' }}
                  >
                    {t('Upload banner')}
                  </Typography>
                )}
                {channel.banner && (
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
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            sx={{ position: 'relative' }}
            {...(isOwner && { component: 'label', htmlFor: 'thumbnail-image', sx: { position: 'relative', cursor: 'pointer' } })}
          >
            <Avatar alt={channel.title} src={channel.thumbnail || ''} sx={{ width: 100, height: 100 }} />
            {isOwner && (
              <Fade in={avatarHover || !channel.thumbnail}>
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
                  <Tooltip title={t('Upload thumbnail. 100 x 100 size is recommended.')}>
                    <IconButton size="small" component="label" htmlFor="thumbnail-image" sx={{ p: 0.5 }}>
                      <FileUploadOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {channel.thumbnail && (
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
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {channel.title || t('Channel title here')}
              <Typography variant="caption">
                {channel.owner.name}
                {channel.modified && ` • ${t(...formatRelativeTime(new Date(channel.modified)))}`}
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
            {channel.description ? (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: decodeURLText(channel.description) }}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('Channel description here')}
                </Typography>
                <Button size="small" onClick={() => navigate(`/channel/${username}/setting`)}>
                  {t('Edit')}
                </Button>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
      <Box sx={{ minHeight: '50px' }}>
        <HomeTabs activeTabs={data?.active_resources} />
      </Box>
      <Outlet />
    </>
  );
};

interface Props {
  activeTabs?: string[];
}

const HomeTabs = ({ activeTabs }: Props) => {
  const { t } = useTranslation('channel');
  const { username } = useParams();
  const { pathname } = useLocation();
  const spacerRef = useAtomValue(spacerRefState);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isFixed, setIsFixed] = useState(false);
  const lastScrollY = useRef(0);
  const user = useAtomValue(userState);
  const channel = useAtomValue(channelState);

  // update spacerRef height
  useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  // tabs
  const isOwner = user && user.username === channel?.owner.username;
  const tabs = useMemo(() => {
    const dynamicTabs: Array<Array<string>> = [
      [t('Home'), 'home'],
      [t('Video'), 'video'],
      [t('Short'), 'short'],
      [t('Playlist'), 'playlist'],
      [t('Asset'), 'asset'],
      [t('Quiz'), 'quiz'],
      [t('Survey'), 'survey'],
      [t('Exam'), 'exam'],
      [t('Lesson'), 'lesson'],
      [t('Course'), 'course'],
      [t('Q&A'), 'qna'],
    ];

    const privateTabs: Array<Array<string>> = [
      ['', 'divider'],
      [t('Comment'), 'comment'],
      [t('Member'), 'member'],
      [t('Setting'), 'setting'],
    ];
    return dynamicTabs.filter(([, path]) => activeTabs?.includes(path)).concat(isOwner ? privateTabs : []);
  }, [activeTabs, isOwner, t]);

  // current tab
  const tabIndex = tabs.findIndex(([, path]) => {
    return path === '' ? pathname === `/channel/${username}/home` : pathname.startsWith(`/channel/${username}/${path}`);
  });

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

  if (!tabs.length) return null;

  return (
    <Box
      ref={tabsRef}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center',
        top: spacerRef?.clientHeight,
        zIndex: 6,
        bgcolor: 'background.paper',
        ...(isFixed && { position: 'fixed', width: '-webkit-fill-available' }),
      }}
    >
      <Tabs
        selectionFollowsFocus
        value={tabIndex < 0 ? 0 : tabIndex}
        role="navigation"
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{ minHeight: 'unset' }}
      >
        {tabs.map(([title, path]) =>
          path === 'divider' ? (
            <Tab key={path} label="" icon={<Divider orientation="vertical" />} disabled sx={{ minWidth: 'unset' }} />
          ) : (
            <Tab
              component={Link}
              key={path}
              label={title}
              iconPosition="start"
              to={`/channel/${username}${path ? `/${path}` : ''}`}
              sx={{ minHeight: 'inherit', minWidth: 'unset', fontWeight: 700 }}
            />
          ),
        )}
      </Tabs>
    </Box>
  );
};
