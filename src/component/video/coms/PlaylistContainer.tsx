import {
  VideoDisplayResponse,
  VideoGetDisplaysData,
  VideoGetDisplaysResponse,
  playlistGetView,
  playlistUpdatePlaylistVideos,
  videoGetDisplays,
} from '@/api';
import { InfiniteScrollIndicator, useInfinitePagination, useServiceImmutable } from '@/component/common';
import { formatDuration, textEllipsisCss, toFixedHuman } from '@/helper/util';
import { userState } from '@/store';
import DragHandleOutlined from '@mui/icons-material/DragHandleOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, BoxProps, Chip, Divider, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, arrayMove, arrayRemove } from 'react-movable';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeVideoIdState, playerHeightState } from '..';
import VideoCard from '../VideoCard';

interface IProps {
  playlistId: string;
  sidebar?: boolean;
  sx?: BoxProps['sx'];
}

const PlaylistContainer = ({ playlistId, sidebar, sx, ...props }: IProps) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();
  const localtion = useLocation();
  const user = useAtomValue(userState);
  const videoId = useAtomValue(activeVideoIdState);
  const playerHeight = useAtomValue(playerHeightState);
  const activeVideoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);

  const [videos, setVideos] = useState<VideoDisplayResponse[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const { data: playlist } = useServiceImmutable(playlistGetView, { id: playlistId });
  const { data, isLoading, isValidating } = useInfinitePagination<VideoGetDisplaysData, VideoGetDisplaysResponse>({
    apiOptions: { playlistId },
    apiService: videoGetDisplays,
    infiniteScrollRef,
  });

  const goToPlaylist = () => {
    const to = `/playlist/${playlistId}`;
    if (to != localtion.pathname) navigate(to);
  };

  const updateOrder = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (oldIndex === newIndex) return;
    if (oldIndex === order.length - 1 && newIndex === order.length) return;

    const videoId = order[oldIndex];
    setOrder(newIndex === -1 ? arrayRemove(order, oldIndex) : arrayMove(order, oldIndex, newIndex));

    playlistUpdatePlaylistVideos({
      requestBody: {
        videos: [
          {
            playlist_id: playlistId,
            video_id: videoId,
            order: newIndex == -1 ? null : newIndex,
          },
        ],
      },
    }).catch((error) => console.error(error));
  };

  // update videos
  useEffect(() => {
    if (data) {
      const videos = data.map((page) => page.items).flat();
      setVideos(videos);
      setOrder(videos.map((video) => video.id));
    }
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    const active = activeVideoRef.current;
    if (container && active) {
      container.scrollTo({
        top: active.offsetTop - container.offsetTop - container.offsetHeight / 2 + active.offsetHeight,
        left: 0,
        behavior: 'smooth',
      });
    }
  }, [playerHeight, videoId, containerRef?.current]); // eslint-disable-line

  if (!playlist) return null;

  return (
    <Box
      sx={{
        flexGrow: sidebar ? 0 : 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'auto',
        ...(sidebar && {
          borderRadius: theme.shape.borderRadius / 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }),
        ...sx,
      }}
      {...props}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', ...(sidebar ? { px: '1em', py: '.5em' } : { p: '1em', pt: 0 }) }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          <Box
            onClick={goToPlaylist}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontSize: '1.2em',
              cursor: sidebar ? 'pointer' : 'default',
              minHeight: '34px',
              ...textEllipsisCss(1),
            }}
          >
            {!!playlist.uploader && `${[playlist.uploader]}`} {playlist.title}
          </Box>
        </Typography>
        <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />}>
          <Typography variant="subtitle2">{t('Video count {{ count }}', { count: playlist.video_count })}</Typography>
          {!!playlist.live_count && (
            <Typography variant="subtitle2">{t('Live count {{ count }}', { count: playlist.live_count })}</Typography>
          )}
          <Typography variant="subtitle2">
            {t('Total time')} {formatDuration(playlist.duration || 0)}
          </Typography>
        </Stack>
        {!!user && playlist.progress != null && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle2">{t('Completed videos {{ str }}', { str: playlist.passed_str || '' })}</Typography>
            <LinearProgress
              sx={{ flexGrow: 1 }}
              variant="determinate"
              color={playlist.passed ? 'success' : 'warning'}
              value={Math.min(Math.floor(playlist.progress), 100)}
            />
            <Typography
              variant="subtitle2"
              sx={{ minWidth: '3em', textAlign: 'right' }}
            >{`${toFixedHuman(playlist.progress, 1)}%`}</Typography>
          </Stack>
        )}
      </Box>
      <Box sx={{ overflowY: 'scroll', overflowX: 'hidden' }} ref={containerRef}>
        <List
          removableByMove
          values={order}
          onChange={updateOrder}
          renderList={({ children, props }) => {
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', py: '4px', maxHeight: '100%' }} {...props}>
                {children}
                <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} small={sidebar} />
              </Box>
            );
          }}
          renderItem={({ index, value, props, isDragged, isSelected, isOutOfBounds }) => {
            const video = videos.find((v) => v.id === value);
            const active = value == videoId;

            return (
              video && (
                <Box
                  ref={active ? activeVideoRef : undefined}
                  sx={{
                    display: 'flex',
                    py: sidebar ? '.2em' : '.3em',
                    ...((isDragged || isSelected) && {
                      bgcolor: theme.palette.action.hover,
                      zIndex: theme.zIndex.tooltip + 1,
                      borderRadius: theme.shape.borderRadius / 2,
                      outline: `1px solid ${theme.palette.action.selected}`,
                    }),
                  }}
                  {...props}
                  key={value}
                >
                  <>
                    {/* do not remove framgment. it's required for forwardRef key */}
                    <Typography variant="caption" sx={{ minWidth: '2em', alignSelf: 'center', textAlign: 'center' }}>
                      {active ? <PlayArrowIcon sx={{ fontSize: '1.5em' }} /> : index != undefined ? index + 1 : ''}
                    </Typography>

                    <VideoCard
                      video={video}
                      to={`/video/${video.id}?p=${playlistId}`}
                      sx={{
                        flexGrow: 1,
                        flexDirection: 'row',
                        '& .card-banner': { width: '168px', minWidth: '168px', aspectRatio: '16 / 9' },
                      }}
                      hideAvatar
                    />

                    {!sidebar && user && user.username === playlist.owner.username ? (
                      <Box
                        data-movable-handle
                        tabIndex={-1}
                        sx={{ position: 'relative', padding: '2px', cursor: 'grab', alignSelf: 'center' }}
                      >
                        {isOutOfBounds && (
                          <Box sx={{ position: 'absolute', top: '-2.5em', left: '50%', transform: 'translateX(-50%);' }}>
                            <Chip label={t('Will be removed')} color="error" />
                          </Box>
                        )}
                        <DragHandleOutlined />
                      </Box>
                    ) : (
                      <Box data-movable-handle />
                    )}
                  </>
                </Box>
              )
            );
          }}
        />
      </Box>
    </Box>
  );
};

export default PlaylistContainer;
