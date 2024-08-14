import { VideoDisplayResponse } from '@/api';
import ResourceCard from '@/component/common/ResourceCard';
import { formatDuration, formatRelativeTime, humanNumber } from '@/helper/util';
import { StreamOutlined } from '@mui/icons-material';
import { Box, BoxProps, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { activeVideoIdState } from '.';
import VideoActionMenu from './VideoActionMenu';

interface IProps {
  video: VideoDisplayResponse;
  hideAvatar?: boolean;
  to?: string;
  sx?: BoxProps['sx'];
  showDescription?: boolean;
}

const VideoCard = ({ video, hideAvatar, to, sx, showDescription }: IProps) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();
  const activeVideoId = useAtomValue(activeVideoIdState);

  return (
    <ResourceCard
      resource={video}
      onClick={() => navigate(to || `/video/${video.id}`)}
      banner={
        <>
          <Box
            component="img"
            alt={video.title}
            src={video.thumbnail}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              aspectRatio: video.video_kind == 'short' ? '9 / 16' : '16 / 9',
            }}
          />

          {(video.duration != null || video.is_live) && (
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
                bgcolor: video.is_live ? theme.palette.error.dark : 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {video.duration ? (
                formatDuration(video.duration)
              ) : (
                <>
                  <StreamOutlined fontSize="small" />
                  {t('Live')}
                </>
              )}
            </Typography>
          )}
        </>
      }
      score={video.progress}
      passed={video.passed}
      avatarChildren={[t(...formatRelativeTime(video.modified)), `${t('Views')} ${humanNumber(video.watch_count, t)}`]}
      hideAvatar={hideAvatar}
      actionMenu={<VideoActionMenu video={video} />}
      sx={{ ...sx, bgcolor: activeVideoId === video.id ? theme.palette.action.selected : 'transparent' }}
      showDescription={showDescription}
    />
  );
};

export default VideoCard;
