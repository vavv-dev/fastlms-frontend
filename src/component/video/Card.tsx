import { StreamOutlined } from '@mui/icons-material';
import { Box, BoxProps, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';
import { PreviewPlayer } from './PreviewPlayer';

import { VideoDisplayResponse as DisplayResponse } from '@/api';
import { ResourceCard } from '@/component/common';
import { formatDuration, formatRelativeTime } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  to?: string;
  sx?: BoxProps['sx'];
  showDescription?: boolean;
  disablePreview?: boolean;
}

export const Card = ({ data, hideAvatar, to, sx, showDescription, disablePreview }: Props) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const navigate = useNavigate();
  const [isHover, setIsHover] = useState(false);

  return (
    <ResourceCard
      resource={data}
      onClick={() => navigate(to || `/video/${data.id}`)}
      banner={
        <>
          <Box
            component="img"
            alt={data.title}
            src={data.thumbnail}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              aspectRatio: data.sub_kind == 'short' ? '9 / 16' : '16 / 9',
            }}
          />
          <Box
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3 }}
          >
            {isHover && !disablePreview && <PreviewPlayer id={data.id} onClick={() => navigate(to || `/video/${data.id}`)} />}
          </Box>

          {(data.duration != null || data.sub_kind == 'live') && (
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
                bgcolor: data.sub_kind === 'live' ? theme.palette.error.dark : 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {data.duration ? (
                formatDuration(data.duration)
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
      score={data.progress}
      passed={data.passed}
      avatarChildren={[t(...formatRelativeTime(data.modified))]}
      hideAvatar={hideAvatar}
      actionMenu={<ActionMenu data={data} />}
      sx={sx}
      showDescription={showDescription}
    />
  );
};
