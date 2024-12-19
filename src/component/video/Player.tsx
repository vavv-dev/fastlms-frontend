import { Box, SxProps, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef } from 'react';
import type R from 'react-player/youtube';
import type { YouTubePlayerProps } from 'react-player/youtube';
import { useSearchParams } from 'react-router-dom';

import {
  activeVideoIdState as activeIdState,
  playerHeightState,
  playerInstanceState,
  playerProgressState,
  playerReadyState,
} from '.';

import { VideoGetViewData as GetViewData, VideoGetViewResponse as GetViewResponse, videoGetView as getView } from '@/api';
import { useServiceImmutable } from '@/component/common';

// For fast switching between videos, do not use state
const lastPositions = {};

const ReactPlayer = lazy(() => import('react-player/youtube'));

export const Player = ({ id, sx }: { id: string; sx?: SxProps }) => {
  const theme = useTheme();
  const setPlayerHeight = useSetAtom(playerHeightState);
  const setActiveId = useSetAtom(activeIdState);
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const playerRatio = data?.sub_kind === 'short' ? 9 / 16 : 16 / 9;

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

  useEffect(() => {
    if (!data) return;
    setActiveId(data.id);
    return () => setActiveId(null);
  }, [data?.id]); // eslint-disable-line

  if (!data) return null;

  return (
    <Box
      className="player-wrapper"
      ref={elementRef}
      sx={{
        borderRadius: { xs: 0, md: theme.shape.borderRadius },
        overflow: 'hidden',
        width: '100%',
        height: 'auto',
        maxWidth: playerRatio >= 1 ? '100%' : `calc((100vh - 220px) * ${playerRatio})`,
        maxHeight: 'calc(100vh - 200px)',
        minWidth: '300px',
        minHeight: 'calc(300px * 9 / 16)',
        mx: 'auto',
        aspectRatio: playerRatio,
        bgcolor: 'black',
        ...sx,
      }}
    >
      <Suspense>
        <YouTubePlayer id={id} lastPosition={data.last_position} />
      </Suspense>
    </Box>
  );
};

const YouTubePlayer = ({ id, lastPosition }: { id: string; lastPosition: number | null }) => {
  const setPlayerInstance = useSetAtom(playerInstanceState);
  const [searchParams] = useSearchParams();
  const setPlayerProgress = useSetAtom(playerProgressState);
  const setPlayerReady = useSetAtom(playerReadyState);
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const playerRef = useRef<R | null>(null);

  const tParam = searchParams.get('t');
  const t = useMemo(() => tParam || lastPositionsRef.current[id] || lastPosition, [tParam, id, lastPosition]);

  useEffect(() => {
    if (playerRef.current) {
      setPlayerInstance(playerRef.current);
    }
  }, [playerRef.current]); // eslint-disable-line

  return (
    <ReactPlayer
      progressInterval={900.0}
      onProgress={({ playedSeconds }: { playedSeconds: number }) => {
        setPlayerProgress(playedSeconds);
        lastPositionsRef.current[id] = playedSeconds;
      }}
      onReady={() => setPlayerReady((prev) => ++prev)}
      ref={playerRef}
      url={`https://www.youtube.com/watch?v=${id}${t ? `&t=${t}` : ''}`}
      {...options}
    />
  );
};

const options: YouTubePlayerProps = {
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
