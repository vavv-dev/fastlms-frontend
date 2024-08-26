import { VideoGetViewData as GetViewData, VideoGetViewResponse as GetViewResponse, videoGetView as getView } from '@/api';
import { useServiceImmutable } from '@/component/common/hooks';
import { Box, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import {
  activeVideoIdState as activeIdState,
  playerHeightState,
  playerInstanceState,
  playerProgressState,
  playerReadyState,
} from '.';

export const Player = ({ id, aspectRatio }: { id: string; aspectRatio?: string }) => {
  const theme = useTheme();
  const setPlayerInstance = useSetAtom(playerInstanceState);
  const setPlayerProgress = useSetAtom(playerProgressState);
  const setPlayerReady = useSetAtom(playerReadyState);
  const setPlayerHeight = useSetAtom(playerHeightState);
  const setActiveId = useSetAtom(activeIdState);
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const ref = useRef<ReactPlayer | null>(null);
  const playerRatio = data?.video_kind === 'video' || data?.is_live ? 16 / 9 : 9 / 16;

  // player height
  const elementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = getComputedStyle(entry.target).height;
          if (parseInt(height)) {
            setPlayerHeight(height);
          }
        }
      });
      resizeObserver.observe(node);
    },
    [setPlayerHeight],
  );

  // player instance
  useEffect(() => {
    if (ref.current) {
      setPlayerInstance(ref.current);
    }
  }, [ref.current]); // eslint-disable-line

  useEffect(() => {
    if (!data) return;
    setActiveId(data.id);
    return () => setActiveId(null);
  }, [data?.id]); // eslint-disable-line

  if (!data) return null;

  return (
    <Box
      ref={elementRef}
      sx={{
        borderRadius: { xs: 0, md: theme.shape.borderRadius },
        overflow: 'hidden',
        width: '100%',
        height: 'auto',
        maxWidth: playerRatio >= 1 ? '100%' : `calc((100vh - 200px) * ${playerRatio})`,
        maxHeight: 'calc(100vh - 200px)',
        mx: 'auto',
        aspectRatio: aspectRatio || playerRatio,
        bgcolor: 'black',
      }}
    >
      <ReactPlayer
        progressInterval={900.0}
        onProgress={({ playedSeconds }) => setPlayerProgress(playedSeconds)}
        onReady={() => setPlayerReady((prev) => ++prev)}
        ref={ref}
        url={`https://www.youtube.com/watch?v=${id}`}
        {...options}
      />
    </Box>
  );
};

const options = {
  playing: true,
  controls: true,
  width: '100%',
  height: '100%',
  style: {},
  playsinline: true,
  pip: true,
  config: {
    playerVars: {
      modestbranding: 1,
      rel: 0,
    },
    embedOptions: {
      host: 'https://www.youtube-nocookie.com',
    },
  },
};
