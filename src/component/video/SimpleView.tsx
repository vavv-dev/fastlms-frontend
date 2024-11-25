import { StreamOutlined } from '@mui/icons-material';
import { Chip, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Player } from './Player';
import { Subtitle } from './Subtitle';
import { Tracking } from './Tracking';

import { VideoGetViewData as GetViewData, VideoGetViewResponse as GetViewResponse, videoGetView as getView } from '@/api';
import { useServiceImmutable } from '@/component/common';

export const SimpleView = ({ id }: { id: string }) => {
  const { t } = useTranslation('video');
  // to prevent flickering
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });

  if (!data) return null;

  return (
    <Paper
      sx={{
        overflow: 'auto',
        width: '100%',
        maxWidth: 'lg',
        borderRadius: 3,
        p: 3,
        my: 'auto',
        '& .subtitlebox': { height: '400px', flexGrow: 1 },
      }}
    >
      <Player id={id} />
      <Typography
        variant="subtitle1"
        sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', lineHeight: 1.2, my: '1em', gap: 1 }}
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
      <Tracking id={id} />
      <Subtitle id={id} />
    </Paper>
  );
};
