import { SkipPreviousOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Box } from '@mui/system';
import { useAtomValue } from 'jotai';
import throttle from 'lodash/throttle';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReward } from 'react-rewards';

import { playerInstanceState, playerProgressState } from '.';

import {
  VideoDisplayResponse as DisplayResponse,
  VideoGetViewData as GetViewData,
  VideoGetViewResponse as GetViewResponse,
  VideoGetWatchBitmapData as GetWatchBitmapData,
  VideoGetWatchBitmapResponse as GetWatchBitmapResponse,
  WatchUpdateRequest,
  videoGetDisplays as getDisplays,
  videoGetView as getView,
  videoGetWatchBitmap as getWatchBitmap,
  videoStartWatch as startWatch,
  videoUpdateWatch as updateWatch,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { formatDuration, toFixedHuman } from '@/helper/util';
import { userState } from '@/store';

const PERSIST_EVENT = ['beforeunload', 'pagehide', 'visibilitychange'];
const MAX_WATCH_DURATION = 60 * 60 * 3; // 3 hours
const DEBOUNCE_THROTTLE = 500;

// This enables fast switching between videos with watch status
const lastPositions = {};
const watchBitmaps = {};

export const Tracking = ({ id, hidden }: { id: string; hidden?: boolean }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const playerInstance = useAtomValue(playerInstanceState);
  const progress = useAtomValue(playerProgressState);
  const { reward } = useReward('completed', 'confetti', { position: 'absolute' });
  const hasRewarded = useRef(false);
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const watchBitmapsRef = useRef<Record<string, number[]>>(watchBitmaps);
  const watchProgressRef = useRef<SVGSVGElement | null>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const { data: watchBitmap } = useServiceImmutable<GetWatchBitmapData, GetWatchBitmapResponse>(getWatchBitmap, {
    id: data?.last_position ? data.id : '', // not id but data.id.
  });
  const prevPercentRef = useRef(0);

  const trackingImpossible = !data || !data.duration || data.duration > MAX_WATCH_DURATION;

  const skippedPosition = useMemo(() => {
    if (trackingImpossible) return -1;
    const arr = watchBitmapsRef.current[id];
    if (!arr) return -1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 0) {
        return i;
      }
    }
    return -1;
  }, [progress, data?.id]); // eslint-disable-line

  const percent: number = useMemo(() => {
    if (trackingImpossible) return 0;
    if (!data.duration) return 0;
    const percent = (watchBitmapsRef.current[id]?.filter((v) => v === 1).length / data.duration) * 100;
    return Math.min(isNaN(percent) ? 0 : percent, 100);
  }, [progress, data?.id]); // eslint-disable-line

  /**
   *
   * initialize watch bitmap
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    // watch bitmap
    if (!watchBitmapsRef.current[data.id]) {
      // if first watch, save first watch time
      if (data.last_position === null) throttlePersistWatch(data.id);

      watchBitmapsRef.current[id] = Array(data?.duration || 0).fill(0);
    }

    watchBitmapsRef.current[id].forEach((v, i) => {
      if (v === 1) updateWatchProgressBar(i);
    });
  }, [data?.id]); // eslint-disable-line

  /**
   * merge existing bitmap with new bitmap
   */
  const mergeBitmaps = (existingBitmap: number[], newBitmap: number[]): number[] => {
    return existingBitmap.map((value, index) => value || newBitmap[index] || 0);
  };

  /**
   *
   * load watch bitmap
   * convert bytes to bit array
   *
   */
  useEffect(() => {
    if (trackingImpossible || !watchBitmap) return;

    const currentBitmap = watchBitmapsRef.current[id];
    watchBitmap?.arrayBuffer().then((arrayBuffer) => {
      const uint8Array = new Uint8Array(arrayBuffer);
      const serverBitmap = Array(currentBitmap.length).fill(0);

      // watch bitmap to bit array
      for (let i = 0; i < uint8Array.length && i * 8 < serverBitmap.length; i++) {
        const byte = uint8Array[i];
        for (let j = 7; j >= 0 && i * 8 + (7 - j) < serverBitmap.length; j--) {
          const bit = (byte >> j) & 1;
          serverBitmap[i * 8 + (7 - j)] = bit;
        }
      }

      // Merge server bitmap with current bitmap
      const mergedBitmap = mergeBitmaps(currentBitmap, serverBitmap);
      watchBitmapsRef.current[id] = mergedBitmap;

      // Update progress bar
      mergedBitmap.forEach((v, i) => {
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

    const currentId = player.getVideoData?.()?.video_id;
    if (!currentId) return;

    // fix too fast switch video
    if (currentId !== data.id) return;

    // update last position
    const position = player.getCurrentTime?.();
    if (!position) return;

    // cache current position
    lastPositionsRef.current[currentId] = position;

    // update watch bitmap
    const currentBitmap = watchBitmapsRef.current[currentId];
    if (!currentBitmap) return;

    const positionInt = Math.floor(position);
    currentBitmap[Math.floor(positionInt)] = 1;

    // update watch progress bar
    updateWatchProgressBar(positionInt);
  }, [progress, data?.id]); // eslint-disable-line

  /**
   *
   * last persist
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    if ((percent >= data.cutoff_progress && prevPercentRef.current < data.cutoff_progress) || percent >= 100) {
      throttlePersistWatch(data.id);
    }
    prevPercentRef.current = percent;
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
      if (e.type === 'visibilitychange') {
        if (document.visibilityState !== 'hidden') return;
        // do not use throttle
        persistWatch(data.id);
      } else {
        throttlePersistWatch(data.id);
      }
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
      throttlePersistWatch(data.id);

      // clean up
      PERSIST_EVENT.forEach((event) => {
        window.removeEventListener(event, eventWrapper);
      });
    };
  }, [data?.id]); // eslint-disable-line

  /**
   *
   * Persist
   *
   */
  const persistWatch = async (id: string) => {
    if (trackingImpossible) return;

    // first watch check...
    if (!watchBitmapsRef.current[data.id] && data.last_position == null) {
      startWatch({
        id: data.id,
        requestBody: { first_watch: String(new Date().getTime() - DEBOUNCE_THROTTLE) },
      }).catch((e) => console.error(e));
    }

    const position = lastPositionsRef.current[id];
    if (!position) return;

    const currentPosition = Math.floor(position);
    const watch: WatchUpdateRequest = {
      last_position: currentPosition,
    };

    const newBitmap = watchBitmapsRef.current[id];
    if (newBitmap) {
      // Convert newBitmap bitarray to bytes
      const byteArray = new Uint8Array(Math.ceil(newBitmap.length / 8));
      for (let i = 0; i < newBitmap.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
          if (i + j < newBitmap.length) {
            byte |= (newBitmap[i + j] & 1) << (7 - j);
          }
        }
        byteArray[i / 8] = byte;
      }

      const newBitmapHex = Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      let hasChanges = false;

      if (watchBitmap) {
        const existingBitmapHex = await blobToHex(watchBitmap);
        if (newBitmapHex !== existingBitmapHex) {
          watch['length'] = newBitmap.length;
          watch['watch_bitmap'] = newBitmapHex as unknown as Blob;
          hasChanges = true;
        }
      } else {
        watch['length'] = newBitmap.length;
        watch['watch_bitmap'] = newBitmapHex as unknown as Blob;
        hasChanges = true;
      }

      if (!hasChanges && data.last_position === currentPosition) {
        return;
      }
    }

    updateWatch({ id, requestBody: watch })
      .then(() => {
        const currentBitmap = watchBitmapsRef.current[id];
        const progress = currentBitmap ? (currentBitmap.filter((v) => v === 1).length / currentBitmap.length) * 100 : 0;
        const updated = {
          id: id,
          progress: Math.min(progress, 100),
          passed: progress >= data.cutoff_progress,
        };
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
      })
      .catch((e) => console.error(e));
  };

  // Helper function to convert Blob to hex string
  const blobToHex = async (blob: Blob): Promise<string> => {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return Array.from(uint8Array)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  /**
   *
   * reward
   *
   */

  useEffect(() => {
    if (trackingImpossible) return;
    if (!rewardRef.current || percent < 100) return;
    if (hasRewarded.current) return;
    hasRewarded.current = true;
    setTimeout(() => reward(), 10);
  }, [percent, id, rewardRef.current]); // eslint-disable-line

  /**
   *
   * utils
   *
   */

  // debounce persist watch
  const throttlePersistWatch = throttle((id: string) => persistWatch(id), DEBOUNCE_THROTTLE);

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
  if (!data?.duration) return null;
  if (data.duration > MAX_WATCH_DURATION) return null;

  // hidden mode
  if (hidden) return <Box ref={watchProgressRef}></Box>;

  const progressColor = percent >= data.cutoff_progress ? theme.palette.success.main : theme.palette.warning.main;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default', minHeight: '40px' }}>
        <Typography variant="subtitle2">{t('Watch segment')}</Typography>
        <Tooltip title={`${toFixedHuman(percent, 1)}%`}>
          <Typography
            variant="subtitle2"
            sx={{ py: '4px', width: '2.5em', textAlign: 'right' }}
          >{`${Math.floor(percent)}%`}</Typography>
        </Tooltip>
        <Box sx={{ flexGrow: 1, position: 'relative', height: '4px', bgcolor: alpha(progressColor, 0.4) }}>
          <Box
            ref={watchProgressRef}
            component="svg"
            viewBox={`0 0 ${data?.duration || 0} 4`}
            preserveAspectRatio="none"
            sx={{ width: '100%', height: '4px', position: 'absolute', top: 0, left: 0, '& rect': { stroke: progressColor } }}
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
