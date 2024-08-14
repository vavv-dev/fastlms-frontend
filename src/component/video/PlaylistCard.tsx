import { PlaylistDisplayResponse, playlistGetDisplay, playlistResumePlaylist, playlistToggleAction } from '@/api';
import ResourceCard from '@/component/common/ResourceCard';
import { formatDuration, formatRelativeTime } from '@/helper/util';
import { Box, BoxProps, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PlaylistActionMenu from './PlaylistActionMenu';
import { createToggleAction } from '../common';

interface IProps {
  playlist: PlaylistDisplayResponse;
  hideAvatar?: boolean;
  sx?: BoxProps['sx'];
}

const toggleAction = createToggleAction<PlaylistDisplayResponse>(playlistToggleAction, playlistGetDisplay);

const PlaylistCard = ({ playlist, hideAvatar }: IProps) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();

  const resume = () => {
    if (!playlist) return;
    void navigate;
    playlistResumePlaylist({ id: playlist.id }).then(({ video_id }) => {
      navigate(`/video/${video_id}?p=${playlist.id}`);
    });
  };

  return (
    <ResourceCard
      resource={playlist}
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      banner={
        <>
          <Box
            component="img"
            alt={playlist.title}
            src={playlist.thumbnail}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              aspectRatio: '16 / 9',
              borderRadius: '8px',
              boxShadow: `0 -2px 0 0 ${theme.palette.background.paper}`,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              px: '6px',
              borderRadius: '4px',
              fontWeight: '600',
              zIndex: 2,
              color: theme.palette.common.white,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <span>{formatDuration(playlist.duration)}</span>
            <span>{t('{{ count }} videos', { count: playlist.video_count })}</span>
          </Typography>
          <Box
            sx={{
              height: 'calc(100% - 8px)',
              position: 'absolute',
              top: '-6px',
              left: '4px',
              width: 'calc(100% - 8px)',
              borderRadius: '8px',
              zIndex: -1,
              overflow: 'hidden',
              willChange: 'transform',
            }}
          >
            <Box
              component="img"
              alt=""
              src={playlist.thumbnail}
              loading="lazy"
              sx={{
                objectFit: 'cover',
                aspectRatio: '16 / 9',
                width: '100%',
                height: '100%',
                filter: 'blur(10px) brightness(0.5)',
                willChange: 'filter',
              }}
            />
          </Box>
        </>
      }
      score={playlist.progress}
      passed={playlist.passed}
      avatarChildren={[t(...formatRelativeTime(playlist.modified))]}
      hideAvatar={hideAvatar}
      actionMenu={<PlaylistActionMenu playlist={playlist} />}
      sx={{ '& .card-banner': { overflow: 'visible' } }}
      footer={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              resume();
            }}
            sx={{ minWidth: 0, alignSelf: 'flex-start', py: 0 }}
          >
            {t('Resume')}
          </Button>
          {!playlist.bookmarked && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleAction('bookmark', playlist);
              }}
              sx={{ alignSelf: 'flex-start', py: 0 }}
            >
              {t('Add to my list')}
            </Button>
          )}
        </Box>
      }
    />
  );
};

export default PlaylistCard;
