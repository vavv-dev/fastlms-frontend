import { StreamOutlined } from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Player } from './Player';
import { Subtitle } from './Subtitle';
import { Tracking } from './Tracking';

import { VideoGetViewData as GetViewData, VideoGetViewResponse as GetViewResponse, videoGetView as getView } from '@/api';
import { useServiceImmutable } from '@/component/common';

export const SimpleView = memo(({ id }: { id: string }) => {
  const { t } = useTranslation('video');
  // to prevent flickering
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });

  if (!data) return null;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 'lg',
        p: { xs: 0, md: 3 },
        pb: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Player id={id} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 2, md: 0 } }}>
        <Tracking id={id} />
        <Typography
          variant="subtitle1"
          sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', lineHeight: 1.2, gap: 1 }}
        >
          {data.sub_kind === 'live' && (
            <Typography component="span" variant="subtitle2">
              <Chip
                label={t('LIVE')}
                color="error"
                sx={{ borderRadius: '4px', bgcolor: '#da0100', height: '1.8em' }}
                icon={<StreamOutlined sx={{ fontSize: '1rem' }} />}
              />
            </Typography>
          )}
          {!!data.uploader && `${[data.uploader]}`} {data.title}
        </Typography>
      </Box>
      <Subtitle id={id} sx={{ px: { xs: 2, md: 0 } }} />
    </Box>
  );
});
