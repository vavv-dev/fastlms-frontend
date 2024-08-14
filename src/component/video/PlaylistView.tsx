import {
  PlaylistGetViewData,
  PlaylistViewResponse,
  VideoGetDisplayData,
  VideoGetDisplayResponse,
  VideoSelectResponse,
  playlistGetView,
  playlistResumePlaylist,
  videoAutocomplete,
  videoGetDisplay,
  videoUpdatePlaylistVideos,
} from '@/api';
import { AutocompleteSelect2, WithAvatar, useInfinitePagination, useServiceImmutable } from '@/component/common';
import { formatDuration, generateRandomDarkColor } from '@/helper/util';
import { userState } from '@/store';
import { PlaylistAddOutlined, PlaylistPlayOutlined, Refresh } from '@mui/icons-material';
import { Box, Button, CardMedia, Divider, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import PlaylistActionMenu from './PlaylistActionMenu';
import PlaylistContainer from './coms/PlaylistContainer';

const Playlist = () => {
  const playlistId = useParams().playlistId;

  if (!playlistId) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box m="auto" maxWidth="lg" sx={{ display: 'flex', gap: '1em', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <PlaylistSidebar playlistId={playlistId} />
        <PlaylistContainer playlistId={playlistId} />
      </Box>
    </Box>
  );
};

export default Playlist;

const PlaylistSidebar = ({ playlistId }: { playlistId: string }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const { data: playlist, mutate: playlistMutate } = useServiceImmutable<PlaylistGetViewData, PlaylistViewResponse>(
    playlistGetView,
    { id: playlistId },
  );
  const { data: videoPages, mutate: videoPagesMutate } = useInfinitePagination<VideoGetDisplayData, VideoGetDisplayResponse>({
    apiOptions: { playlistId },
    apiService: videoGetDisplay,
  });
  const [videoSelectOpen, setVideoSelectOpen] = useState(false);

  const resume = () => {
    if (!playlist) return;
    void navigate;
    playlistResumePlaylist({ id: playlistId }).then(({ video_id }) => {
      navigate(`/video/${video_id}?p=${playlistId}`);
    });
  };

  const refresh = () => {
    playlistMutate();
    videoPagesMutate();
  };

  const addVideos = (selected: Array<VideoSelectResponse>) => {
    if (!playlist) return;
    videoUpdatePlaylistVideos({
      requestBody: {
        videos: selected.map((v, i) => ({
          playlist_id: playlistId,
          video_id: v.id,
          order: playlist.video_count + i,
        })),
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
                <Box sx={{ maxWidth: '100%' }} dangerouslySetInnerHTML={{ __html: playlist.description }} />
              )}

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <WithAvatar
                  variant="large"
                  name={playlist.owner.name}
                  username={playlist.owner.username}
                  thumbnail={playlist.owner.thumbnail}
                  color="white"
                >
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
                    <Button
                      onClick={resume}
                      variant="outlined"
                      color="inherit"
                      startIcon={<PlaylistPlayOutlined />}
                      sx={{ color: 'white' }}
                    >
                      {t('Resume')}
                    </Button>

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
                        <PlaylistActionMenu playlist={playlist} />
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
        <AutocompleteSelect2<VideoSelectResponse>
          service={videoAutocomplete}
          labelField="title"
          open={videoSelectOpen}
          setOpen={setVideoSelectOpen}
          placeholder={t('Add videos to playlist')}
          onSelect={addVideos}
          excludes={new Set(videoPages?.flatMap((p) => p.items).map((v) => v.id))}
        />
      )}
    </Box>
  );
};
