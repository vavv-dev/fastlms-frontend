import { VolumeOffOutlined, VolumeUpOutlined } from '@mui/icons-material';
import { Box, Fade, IconButton, Slider, Stack, useTheme } from '@mui/material';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type R from 'react-player/youtube';
import type { YouTubePlayerProps } from 'react-player/youtube';

const lastPositions = {};
const sharedConfig: YouTubePlayerProps = {
  playing: true,
  muted: true,
  controls: false,
  width: '100%',
  height: '100%',
  playsinline: true,
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

const ReactPlayer = lazy(() => import('react-player/youtube'));

interface Props {
  id: string;
  onClick?: () => void;
}

export const PreviewPlayer = ({ id, onClick }: Props) => {
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const playerRef = useRef<R | null>(null);
  const config = useRef(sharedConfig);
  const [ready, setReady] = useState(false);

  const handleProgress = useCallback(
    ({ playedSeconds }: { playedSeconds: number }) => {
      lastPositionsRef.current[id] = playedSeconds;
    },
    [id],
  );

  return (
    <Fade in={ready}>
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <Box
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
        />
        <Suspense>
          <ReactPlayer
            ref={playerRef}
            onReady={() => setReady(true)}
            onProgress={handleProgress}
            url={`https://www.youtube.com/watch?v=${id}?t=${lastPositionsRef.current[id] || 0}`}
            {...config.current}
          />
        </Suspense>
        <Stack
          spacing={1}
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: 4,
            width: '100%',
            px: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MuteButton playerRef={playerRef} />
          <ProgressSlider playerRef={playerRef} />
        </Stack>
      </Box>
    </Fade>
  );
};

const MuteButton = ({ playerRef }: { playerRef: React.RefObject<R | null> }) => {
  const theme = useTheme();
  const config = useRef(sharedConfig);
  const [muted, setMuted] = useState(config.current.muted);

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(!muted);
    config.current.muted = !muted;
  };

  useEffect(() => {
    const player = playerRef.current?.getInternalPlayer();
    if (!player) return;
    if (muted) {
      player.mute?.();
    } else {
      player.unMute?.();
    }
  }, [muted, playerRef]);

  return (
    <IconButton size="small" sx={{ color: theme.palette.common.white }} onClick={handleMuteToggle}>
      {muted ? <VolumeOffOutlined /> : <VolumeUpOutlined />}
    </IconButton>
  );
};

const ProgressSlider = ({ playerRef }: { playerRef: React.RefObject<R | null> }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const player = playerRef.current;
      if (player) {
        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }
    };
    const intervalId = setInterval(updateProgress, 132); // 8fps
    return () => clearInterval(intervalId);
  }, [playerRef]);

  return (
    <Slider
      color="error"
      size="small"
      value={progress}
      onChange={(_, newValue) => {
        if (playerRef.current) {
          const value = newValue as number;
          playerRef.current.seekTo(value / 100, 'fraction');
          setProgress(value);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      sx={{
        '& .MuiSlider-thumb': {
          transition: 'left 0.1s linear',
        },
        '& .MuiSlider-track': {
          transition: 'width 0.1s linear',
        },
      }}
    />
  );
};
