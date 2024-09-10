import { VolumeOffOutlined, VolumeUpOutlined } from '@mui/icons-material';
import { Box, Fade, IconButton, Slider, Stack, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactPlayer, { YouTubePlayerProps } from 'react-player/youtube';

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

interface Props {
  id: string;
  onClick?: () => void;
}

export const PreviewPlayer = ({ id, onClick }: Props) => {
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const playerRef = useRef<ReactPlayer | null>(null);
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
        <ReactPlayer
          ref={playerRef}
          onReady={() => setReady(true)}
          onProgress={handleProgress}
          url={`https://www.youtube.com/watch?v=${id}?t=${lastPositionsRef.current[id] || 0}`}
          {...config.current}
        />
        <Stack
          spacing={1}
          direction="row"
          sx={{
            mb: 2,
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

const MuteButton = ({ playerRef }: { playerRef: React.MutableRefObject<ReactPlayer | null> }) => {
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

const ProgressSlider = ({ playerRef }: { playerRef: React.MutableRefObject<ReactPlayer | null> }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }
    };

    const intervalId = setInterval(updateProgress, 1000);
    return () => clearInterval(intervalId);
  }, [playerRef]);

  return (
    <Slider
      color="error"
      size="small"
      value={progress}
      onChange={(_, newValue) => {
        if (playerRef.current) {
          const seekTo = (newValue as number) / 100;
          playerRef.current.seekTo(seekTo, 'fraction');
          setProgress(newValue as number);
        }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
};
