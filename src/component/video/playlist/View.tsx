import { PlaylistAddOutlined, PlaylistPlayOutlined, Refresh } from '@mui/icons-material';
import { Box, CardMedia, Chip, Divider, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';
import { Videos } from './Videos';

import {
  VideoGetDisplaysData as GetDisplaysData,
  VideoGetDisplaysResponse as GetDisplaysResponse,
  PlaylistGetViewData as GetViewData,
  ResourceSchema,
  SharedResourceSelectorData as ResourceSelectorData,
  PlaylistViewResponse as ViewResponse,
  videoGetDisplays as getDisplays,
  playlistGetView as getView,
  sharedResourceSelector as resourceSelector,
  playlistResumePlaylist as resumePlaylist,
  playlistUpdatePlaylistVideos as updatePlaylistVideos,
} from '@/api';
import { AutocompleteSelect2, WithAvatar, useInfinitePagination, useServiceImmutable } from '@/component/common';
import { formatDuration, generateRandomDarkColor } from '@/helper/util';
import { userState } from '@/store';

export const View = () => {
  const playlistId = useParams().id;

  if (!playlistId) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box
        sx={{
          m: 'auto',
          maxWidth: 'lg',
          display: 'flex',
          gap: '1em',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        <PlaylistSidebar playlistId={playlistId} />
        <Videos playlistId={playlistId} />
      </Box>
    </Box>
  );
};

const PlaylistSidebar = ({ playlistId }: { playlistId: string }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const { data: playlist, mutate: playlistMutate } = useServiceImmutable<GetViewData, ViewResponse>(getView, { id: playlistId });
  const { data: videos, mutate: videoPagesMutate } = useInfinitePagination<GetDisplaysData, GetDisplaysResponse>({
    apiOptions: { playlistId },
    apiService: getDisplays,
  });
  const [videoSelectOpen, setVideoSelectOpen] = useState(false);

  const resume = () => {
    if (!playlist) return;
    if (videos?.[0] && !playlist.progress) {
      navigate(`/video/${videos[0].items[0].id}?p=${playlistId}`);
    } else {
      resumePlaylist({ id: playlistId }).then(({ video_id }) => {
        navigate(`/video/${video_id}?p=${playlistId}`);
      });
    }
  };

  const refresh = () => {
    playlistMutate();
    videoPagesMutate();
  };

  const addVideos = (selected: Array<ResourceSchema>) => {
    if (!playlist) return;
    updatePlaylistVideos({
      requestBody: {
        videos: selected.map((v, i) => ({ playlist_id: playlistId, video_id: v.id, order: playlist.video_count + i })),
      },
    })
      .then(() => {
        // in infinite pagination, we cannot deal with local cache
        videoPagesMutate();
        playlistMutate();
      })
      .catch((error) => console.error(error));
  };

  if (!playlist) return null;

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: '360px',
        maxWidth: { md: '360px' },
        height: { md: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - 2em - 2em)` },
        position: { md: 'sticky' },
        top: `calc(${theme.mixins.toolbar.minHeight}px + 2em)`,
        borderRadius: theme.shape.borderRadius,
        overflow: 'hidden',
        bgcolor: generateRandomDarkColor(playlistId),
        zIndex: 1,
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={playlist.thumbnail}
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            height: '40vh',
            zIndex: -1,
            transform: 'translateX(-50%)',
            filter: 'blur(100px) opacity(0.8)',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row', md: 'column' }, p: '1.3em', gap: '1.5em' }}>
        <Box sx={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center' }}>
          <CardMedia
            component="img"
            image={playlist.thumbnail}
            sx={{ borderRadius: theme.shape.borderRadius, aspectRatio: '16 / 9' }}
          />

          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              fontWeight: 600,
              color: 'white',
              padding: '1px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              borderRadius: '4px',
            }}
          >
            <PlaylistPlayOutlined />
            <span>{t('{{ count }} videos', { count: playlist.video_count })}</span>
            <span>{formatDuration(playlist.duration)}</span>
          </Typography>
        </Box>

        {playlist && (
          <>
            <Stack spacing={2} direction="column" sx={{ flexGrow: 1, color: 'white' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {!!playlist.uploader && `${[playlist.uploader]}`} {playlist.title}
              </Typography>

              {playlist.description && (
                <Box
                  className="tiptap-content"
                  dangerouslySetInnerHTML={{ __html: playlist.description }}
                  sx={{ maxWidth: '100%' }}
                />
              )}

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <WithAvatar variant="large" {...playlist.owner} color="white">
                  <Box sx={{ display: 'block', color: 'white' }}>
                    <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />}>
                      {playlist.modified && (
                        <Typography component="span" variant="subtitle2">
                          {t('Last updated')} {new Date(playlist.modified).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </WithAvatar>
              </Box>
              <Box sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                {user && (
                  <>
                    <Chip onClick={resume} color="warning" label={playlist.progress ? t('Resume') : t('Start')} />
                    {playlist.owner.username == user.username && (
                      <Tooltip title={t('Add videos')} arrow>
                        <IconButton onClick={() => setVideoSelectOpen(true)} color="inherit">
                          <PlaylistAddOutlined />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title={t('Refresh')} arrow>
                      <IconButton onClick={refresh} color="inherit">
                        <Refresh />
                      </IconButton>
                    </Tooltip>

                    {user && (
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        sx={{ position: 'relative', '& .MuiSvgIcon-root': { color: 'white' } }}
                      >
                        <ActionMenu data={playlist} />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Stack>
          </>
        )}
      </Box>
      {videoSelectOpen && (
        <AutocompleteSelect2<ResourceSchema, ResourceSelectorData>
          service={resourceSelector}
          serviceParams={{ kinds: ['video'] }}
          labelField="title"
          open={videoSelectOpen}
          setOpen={setVideoSelectOpen}
          placeholder={t('Add videos to playlist')}
          onSelect={addVideos}
          excludes={new Set(videos?.flatMap((p) => p.items).map((v) => v.id))}
        />
      )}
    </Box>
  );
};
