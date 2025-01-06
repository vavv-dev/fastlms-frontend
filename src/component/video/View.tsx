import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useAtomValue } from 'jotai';
import { ScrollRestoration, useLocation, useParams } from 'react-router-dom';

import { playerHeightState } from '.';
import { Control } from './Control';
import { Player } from './Player';
import { Related } from './Related';
import { Subtitle } from './Subtitle';
import { Tracking } from './Tracking';
import { Videos } from './playlist/Videos';

import { VideoGetViewData as GetViewData, VideoGetViewResponse as GetViewResponse, videoGetView as getView } from '@/api';
import { Thread } from '@/component/comment';
import { useServiceImmutable } from '@/component/common';
import { textEllipsisCss } from '@/helper/util';

export const View = () => {
  const { id } = useParams();
  const location = useLocation();
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id || '' });
  const playerHeight = useAtomValue(playerHeightState);
  const playlistId = new URLSearchParams(location.search).get('p');

  if (!id || !data) return null;

  return (
    <Box sx={{ display: 'block', maxWidth: 'xxl', width: '100%', m: 'auto' }}>
      <Grid
        container
        sx={{
          maxWidth: 'xxl',
          alignSelf: 'center',
          p: { xs: 0, md: 3 },
          gap: { xs: 0, md: 3 },
          flexWrap: { xs: 'wrap', mdl: 'nowrap' },
        }}
      >
        <Grid
          sx={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: { xs: '100%', md: '650px' },
            '& > :not(div:first-of-type)': {
              px: { xs: 2, md: 0 },
            },
          }}
        >
          <Player id={data.id} />
          <Tracking id={data.id} />
          <Control id={data.id} />
          <Subtitle id={data.id} />
          {data && (
            <Box sx={{ mt: 3 }}>
              <Thread
                url={encodeURIComponent(`${window.location.origin}/video/${data.id}`)}
                title={data.title}
                owner={data.owner}
                resource_kind="video"
                thumbnail={data.thumbnail}
              />
            </Box>
          )}
        </Grid>
        <Grid
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, md: 0 },
            width: '100%',
            maxWidth: { mdl: '402px' },
          }}
        >
          {playlistId && (
            <Videos
              playlistId={playlistId}
              sx={{
                maxHeight: playerHeight || '200px',
                '& .MuiBox-root > .card-banner': {
                  width: '110px',
                  minWidth: '110px',
                  // height: 'fit-content',
                  aspectRatio: '16 / 9',
                },
                '& .card-content .MuiTypography-root': { mt: 0 },
                '& .card-content .content-title': { ...textEllipsisCss(1) },
              }}
              sidebar
            />
          )}
          <Related id={data.id} />
        </Grid>
      </Grid>
      <ScrollRestoration />
    </Box>
  );
};
