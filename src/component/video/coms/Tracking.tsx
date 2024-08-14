import {
  VideoGetWatchBitmapData as BitmapData,
  VideoGetWatchBitmapResponse as BitmapResponse,
  VideoGetViewData,
  VideoGetViewResponse,
  WatchUpdateRequest,
  videoGetView,
  videoGetWatchBitmap,
  videoStartWatch,
  videoUpdateWatch,
} from '@/api';
import { useServiceImmutable } from '@/component/common/hooks';
import { formatDuration, toFixedHuman } from '@/helper/util';
import { userState } from '@/store';
import { SkipPreviousOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useAtomValue } from 'jotai';
import { throttle } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReward } from 'react-rewards';
import { useSearchParams } from 'react-router-dom';
import { playerInstanceState, playerProgressState, playerReadyState } from '..';

const PERSIST_EVENT = ['beforeunload', 'pagehide', 'visibilitychange'];
const MAX_WATCH_DURATION = 60 * 60 * 3; // 3 hours
const DEBOUNCE_THROTTLE = 500;

// This enables fast switching between videos with watch status
const lastPositions = {};
const watchBitmaps = {};

const Tracking = ({ videoId, hidden }: { videoId: string; hidden?: boolean }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const user = useAtomValue(userState);
  const playerInstance = useAtomValue(playerInstanceState);
  const progress = useAtomValue(playerProgressState);
  const ready = useAtomValue(playerReadyState);
  const { reward } = useReward('completed', 'confetti', { position: 'absolute' });
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const watchBitmapsRef = useRef<Record<string, number[]>>(watchBitmaps);
  const watchProgressRef = useRef<SVGSVGElement | null>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const { data: video } = useServiceImmutable<VideoGetViewData, VideoGetViewResponse>(videoGetView, { id: videoId });
  const { data: watchBitmap } = useServiceImmutable<BitmapData, BitmapResponse>(videoGetWatchBitmap, {
    id: video?.last_position ? video.id : '', // not videoId but video.id.
  });

  const trackingImpossible = !video || !video.duration || video.duration > MAX_WATCH_DURATION;

  const skippedPosition = useMemo(() => {
    if (trackingImpossible) return -1;
    const arr = watchBitmapsRef.current[videoId];
    if (!arr) return -1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 0) {
        return i;
      }
    }
    return -1;
  }, [progress, video?.id]); // eslint-disable-line

  const percent: number = useMemo(() => {
    if (trackingImpossible) return 0;
    if (!video.duration) return 0;
    const percent = (watchBitmapsRef.current[videoId]?.filter((v) => v === 1).length / video.duration) * 100;
    return isNaN(percent) ? 0 : percent;
  }, [progress, video?.id]); // eslint-disable-line

  /**
   *
   * initialize last position and watch bitmap
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    // position
    if (lastPositionsRef.current[video.id] == undefined) {
      // if first watch, save first watch time
      if (video.last_position === null) throttlePersistWatch(video.id);

      lastPositionsRef.current[video.id] = video.last_position || 0;
    }

    // watch bitmap
    if (!watchBitmapsRef.current[video.id]) {
      watchBitmapsRef.current[videoId] = Array(video?.duration || 0).fill(0);
    }

    watchBitmapsRef.current[videoId].forEach((v, i) => {
      if (v === 1) updateWatchProgressBar(i);
    });
  }, [video?.id]); // eslint-disable-line

  /**
   *
   *  resume last position
   *
   */
  useEffect(() => {
    if (!ready) return;
    // resume
    const startTime = parseInt(searchParams.get('t') || '', 10) || lastPositionsRef.current[videoId];
    if (startTime) {
      playerInstance?.seekTo(startTime, 'seconds');
    }
  }, [ready]); // eslint-disable-line

  /**
   *
   * load watch bitmap
   * convert bytes to bit array
   *
   */
  useEffect(() => {
    if (trackingImpossible || !watchBitmap) return;

    const emptyBitmap = watchBitmapsRef.current[videoId];
    watchBitmap?.arrayBuffer().then((arrayBuffer) => {
      const uint8Array = new Uint8Array(arrayBuffer);

      // watch bitmap to bit array
      for (let i = 0; i < uint8Array.length && i * 8 < emptyBitmap.length; i++) {
        const byte = uint8Array[i];
        for (let j = 7; j >= 0 && i * 8 + (7 - j) < emptyBitmap.length; j--) {
          const bit = (byte >> j) & 1;
          emptyBitmap[i * 8 + (7 - j)] = bit;
        }
      }

      emptyBitmap.forEach((v, i) => {
        if (v === 1) updateWatchProgressBar(i);
      });
    });
  }, [watchBitmap]); // eslint-disable-line

  /**
   *
   * update position, watch bitmap
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;
    if (!progress) return;

    const player = playerInstance?.getInternalPlayer();
    if (!player) return;

    const position = player.getCurrentTime?.();
    if (!position) return;

    const curVideoId = player.getVideoData()?.video_id;
    if (!curVideoId) return;

    // fix too fast switch video
    if (curVideoId !== video.id) return;

    // update last position
    lastPositionsRef.current[curVideoId] = position;

    // update watch bitmap
    const watchBitmap = watchBitmapsRef.current[curVideoId];
    if (!watchBitmap) return;

    const positionInt = Math.floor(position);
    watchBitmap[Math.floor(positionInt)] = 1;

    // update watch progress bar
    updateWatchProgressBar(positionInt);
  }, [progress, video?.id]); // eslint-disable-line

  /**
   *
   * last persist
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;
    if (percent >= 100) {
      // persist watch
      throttlePersistWatch(video.id);
    }
  }, [percent]); // eslint-disable-line

  /**
   *
   * handle befreounload, pagehide, visibilitychange
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    // persist watch event wrapper
    const eventWrapper = (e: Event) => {
      if (e.type === 'visibilitychange' && !(document.visibilityState === 'hidden')) {
        return;
      }
      throttlePersistWatch(video.id);
    };

    // add event listener
    PERSIST_EVENT.forEach((event) => {
      window.removeEventListener(event, eventWrapper);
      window.addEventListener(event, eventWrapper);
    });

    // cleanup
    const watchProgress = watchProgressRef.current;
    return () => {
      if (!watchProgress) return;
      watchProgress.innerHTML = '';

      // persist watch
      throttlePersistWatch(video.id);

      // clean up
      PERSIST_EVENT.forEach((event) => {
        window.removeEventListener(event, eventWrapper);
      });
    };
  }, [video?.id]); // eslint-disable-line

  /**
   *
   * Persist
   *
   */
  const persistWatch = async (videoId: string) => {
    if (trackingImpossible) return;

    if (lastPositionsRef.current[video.id] == undefined && video.last_position == null) {
      videoStartWatch({
        id: video.id,
        requestBody: { first_watch: String(new Date().getTime() - DEBOUNCE_THROTTLE) },
      }).catch((e) => console.error(e));
    }

    const position = lastPositionsRef.current[video.id];
    if (!position) return;

    const watch: WatchUpdateRequest = {
      last_position: Math.floor(position),
    };

    const watchBitmap = watchBitmapsRef.current[videoId];
    if (watchBitmap) {
      // convert watchBitmap bitarray to bytes
      const byteArray = new Uint8Array(Math.ceil(watchBitmap.length / 8));
      for (let i = 0; i < watchBitmap.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
          if (i + j < watchBitmap.length) {
            byte |= (watchBitmap[i + j] & 1) << (7 - j);
          }
        }
        byteArray[i / 8] = byte;
      }

      watch['length'] = watchBitmap.length;
      watch['watch_bitmap'] = Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('') as unknown as Blob;
    }

    videoUpdateWatch({ id: videoId, requestBody: watch })
      .then(() => {
        // TODO: update cache
      })
      .catch((e) => console.error(e));
  };

  /**
   *
   * reward
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;
    if (!rewardRef.current || percent < 100) return;
    reward();
  }, [percent, videoId, rewardRef.current]); // eslint-disable-line

  /**
   *
   * utils
   *
   */

  // debounce persist watch
  const throttlePersistWatch = throttle((videoId: string) => persistWatch(videoId), DEBOUNCE_THROTTLE);

  // draw watch progress bar
  const updateWatchProgressBar = (x: number) => {
    const svg = watchProgressRef.current;
    if (!svg) return;
    // check already exists
    if (svg.querySelector(`rect[data-position="${x}"]`)) return;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '1');
    rect.setAttribute('height', '4');
    rect.setAttribute('data-position', String(x));
    svg.appendChild(rect);
  };

  const jumpToPosition = (position: number) => {
    const player = playerInstance?.getInternalPlayer();
    if (!player) return;
    const watch = watchBitmapsRef.current[player.getVideoData()?.video_id];
    if (!watch) return;
    player.seekTo(position, 'seconds');
  };

  if (!user) return null;
  if (!video?.duration) return null;
  if (video.duration > MAX_WATCH_DURATION) return null;

  // hidden mode
  if (hidden) return <Box ref={watchProgressRef}></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default', minHeight: '40px' }}>
        <Typography variant="subtitle2">{t('Watch segment')}</Typography>
        <Typography
          variant="subtitle2"
          sx={{ py: '4px', width: '2.5em', textAlign: 'right' }}
        >{`${toFixedHuman(percent, 0)}%`}</Typography>
        <Box sx={{ flexGrow: 1, position: 'relative', height: '4px', bgcolor: 'action.disabledBackground' }}>
          <Box
            ref={watchProgressRef}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              '& rect': { stroke: percent >= video.passing_percent ? theme.palette.success.main : theme.palette.warning.main },
            }}
            component="svg"
            width="100%"
            height="4px"
            viewBox={`0 0 ${video?.duration || 0} 4`}
            preserveAspectRatio="none"
          />
        </Box>
        {percent >= 100 && (
          <Tooltip title={t('Watch completed')} arrow>
            <IconButton onClick={reward} sx={{ fontSize: '1em' }}>
              <Box ref={rewardRef} id="completed" /> 🎉
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={`${t('Jump to skippedPosition position.')} ${formatDuration(Math.abs(skippedPosition))}`} arrow>
          <span>
            <IconButton onClick={() => jumpToPosition(skippedPosition)} disabled={skippedPosition < 0}>
              <SkipPreviousOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Tracking;
