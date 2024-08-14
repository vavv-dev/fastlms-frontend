import { VideoGetViewData, VideoGetViewResponse, videoGetView } from '@/api';
import { CommentThread } from '@/component/comment';
import { useServiceImmutable } from '@/component/common/hooks';
import { textEllipsisCss } from '@/helper/util';
import { Box, Grid } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useLocation, useParams } from 'react-router-dom';
import { playerHeightState } from '.';
import PlaylistContainer from './coms/PlaylistContainer';
import RelatedVideos from './coms/RelatedVideos';
import Subtitle from './coms/Subtitle';
import Tracking from './coms/Tracking';
import VideoControl from './coms/VideoControl';
import VideoPlayer from './coms/VideoPlayer';

const Video = () => {
  const { videoId } = useParams();
  const location = useLocation();
  const { data: video } = useServiceImmutable<VideoGetViewData, VideoGetViewResponse>(videoGetView, { id: videoId || '' });
  const playerHeight = useAtomValue(playerHeightState);
  const playlistId = new URLSearchParams(location.search).get('p');

  if (!video) return null;

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
          <VideoPlayer videoId={video.id} />
          <Tracking videoId={video.id} />
          <VideoControl videoId={video.id} />
          <Subtitle videoId={video.id} />
          {video && (
            <Box sx={{ mt: 3 }}>
              <CommentThread
                url={encodeURIComponent(`${window.location.origin}/video/${video.id}`)}
                title={video.title}
                owner={video.owner}
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
            <PlaylistContainer
              playlistId={playlistId}
              embed
              sx={{
                maxHeight: playerHeight || '200px',
                '& .card-banner': {
                  width: '110px',
                  minWidth: '110px !important',
                  height: 'fit-content !important',
                  aspectRatio: '16 / 9',
                },
                '& .card-content .MuiTypography-root': { mt: 0 },
                '& .card-content .content-title': { ...textEllipsisCss(1) },
              }}
            />
          )}
          <RelatedVideos videoId={video.id} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Video;
