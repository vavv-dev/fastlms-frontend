import {
  PlaylistDisplayResponse as DisplayResponse,
  playlistGetDisplays as getDisplays,
  playlistResumePlaylist as resumePlay,
  playlistUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common';
import { formatDuration, formatRelativeTime } from '@/helper/util';
import { Box, BoxProps, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  sx?: BoxProps['sx'];
}

export const Card = ({ data, hideAvatar, sx }: Props) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();

  const resume = () => {
    if (!data) return;
    void navigate;
    resumePlay({ id: data.id }).then(({ video_id }) => {
      navigate(`/video/${video_id}?p=${data.id}`);
    });
  };

  return (
    <ResourceCard
      resource={data}
      onClick={() => navigate(`/playlist/${data.id}`)}
      banner={
        <>
          <Box
            component="img"
            alt={data.title}
            src={data.thumbnail}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              aspectRatio: '16 / 9',
              borderRadius: '8px',
              boxShadow: `0 -1px 0 0 ${theme.palette.background.paper}`,
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
            <span>{formatDuration(data.duration)}</span>
            <span>{t('{{ count }} videos', { count: data.video_count })}</span>
          </Typography>
          <Box
            sx={{
              height: 'calc(100% - 8px)',
              position: 'absolute',
              top: '-5px',
              left: '8px',
              width: 'calc(100% - 16px)',
              borderRadius: '8px',
              zIndex: -1,
              overflow: 'hidden',
              willChange: 'transform',
            }}
          >
            <Box
              component="img"
              alt=""
              src={data.thumbnail}
              loading="lazy"
              sx={{
                objectFit: 'cover',
                scale: 5,
                aspectRatio: '16 / 9',
                width: '100%',
                height: '100%',
                filter: 'blur(10px)',
                willChange: 'filter',
              }}
            />
          </Box>
        </>
      }
      score={data.progress}
      passed={data.passed}
      avatarChildren={[t(...formatRelativeTime(data.modified))]}
      hideAvatar={hideAvatar}
      actionMenu={<ActionMenu data={data} />}
      sx={{ ...sx, '& .card-banner': { overflow: 'visible' } }}
      footer={
        data.progress && (
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
        )
      }
      partialUpdateService={updateResource}
      listService={getDisplays}
    />
  );
};
