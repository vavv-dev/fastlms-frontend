import { VideoGetViewData as GetViewData, VideoGetViewResponse as GetViewResponse, videoGetView as getView } from '@/api';
import { Thread } from '@/component/comment';
import { useServiceImmutable } from '@/component/common/hooks';
import { textEllipsisCss } from '@/helper/util';
import { Box, Grid } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useLocation, useParams } from 'react-router-dom';
import { playerHeightState } from '.';
import { Control } from './Control';
import { Player } from './Player';
import { Related } from './Related';
import { Subtitle } from './Subtitle';
import { Tracking } from './Tracking';
import { Videos } from './playlist/Videos';

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
          pt: '1em !important',
          gap: { xs: 0, md: 3 },
          flexWrap: { xs: 'wrap', playerSplit: 'nowrap' },
        }}
      >
        <Grid
          item
          sx={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: { xs: '100%', md: '650px' },
            '& > :not(div:first-of-type)': {
              px: { xs: 3, md: 0 },
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
                kind="video"
              />
            </Box>
          )}
        </Grid>
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: { xs: 3, md: 0 },
            width: '100%',
            maxWidth: { playerSplit: '402px' },
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
    </Box>
  );
};
