import { LinearProgress, SxProps, Tooltip } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import throttle from 'lodash/throttle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { pageFamily } from '.';

import {
  AssetDisplayResponse as DisplayResponse,
  AssetWatchUpdateRequest as WatchUpdateRequest,
  assetGetDisplays as getDisplays,
  assetStartWatch as startWatch,
  assetUpdateWatch as updateWatch,
} from '@/api';
import { updateInfiniteCache } from '@/component/common';
import { formatDuration, toFixedHuman } from '@/helper/util';
import { userState } from '@/store';

const PERSIST_EVENT = ['beforeunload', 'pagehide', 'visibilitychange'];
const MAX_WATCH_DURATION = 60 * 60 * 3; // 3 hours
const DEBOUNCE_THROTTLE = 500;

/**
 * !important
 * LastPostion means not real position but last elapsed seconds
 * Because we cannot track watch bitmap about asset content.
 */
const lastPositions = {};

export const Tracking = ({ data, hidden, sx }: { data: DisplayResponse; hidden?: boolean; sx?: SxProps }) => {
  const user = useAtomValue(userState);
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const [progress, setProgress] = useState<number>(data.progress || 0);

  // for to resume epub/pdf
  const [location, setLocation] = useAtom(pageFamily(data.url));

  // no need to save last position
  const trackingImpossible = !data || !data.duration || data.duration > MAX_WATCH_DURATION;

  /**
   *
   * Persist
   *
   */
  const persistWatch = useCallback(
    async (id: string, currentLocation: string | number) => {
      if (trackingImpossible) return;

      // first watch
      const lastPosition = lastPositionsRef.current[id];
      if (!lastPosition && data.progress == null) {
        startWatch({
          id: data.id,
          requestBody: { first_watch: String(new Date().getTime() - DEBOUNCE_THROTTLE) },
        }).catch((e) => console.error(e));
      }

      if (!lastPosition) return;

      const watch: WatchUpdateRequest = {
        last_position: Math.floor(lastPosition),
      };

      // update last location
      watch['last_location'] = currentLocation ? String(currentLocation) : null;

      // convert last position to watch bitmap with data.duration
      const bitmapLength = Math.ceil(data.duration / 8);
      const bitmap = new Uint8Array(bitmapLength);
      for (let i = 0; i < lastPosition; i++) {
        bitmap[i >> 3] |= 1 << (7 - (i % 8));
      }

      // Convert bitmap to hex string
      const bitmapHex = Array.from(bitmap)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      watch['length'] = data.duration;
      watch['watch_bitmap'] = bitmapHex as unknown as Blob;

      updateWatch({ id, requestBody: watch })
        .then(() => {
          // update list cache
          const progress = (lastPosition / data.duration) * 100;
          const updated = {
            id: id,
            progress: Math.min(progress, 100),
            passed: progress >= data.cutoff_progress,
            last_position: lastPosition,
            last_location: watch['last_location'],
          };
          updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
        })
        .catch((e) => console.error(e));
    },
    [data, trackingImpossible],
  );

  // debounce persist watch
  const throttlePersistWatch = useMemo(
    () =>
      throttle((id: string) => {
        persistWatch(id, location);
      }, DEBOUNCE_THROTTLE),
    [persistWatch, location],
  );

  /**
   *
   * initialize
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;
    // local cache
    if (!lastPositionsRef.current[data.id]) {
      // if first watch, save first watch time
      if (data.last_position === null) throttlePersistWatch(data.id);
      lastPositionsRef.current[data.id] = data.last_position || 0;
    }

    const lastPosition = lastPositionsRef.current[data.id];
    const _progress = Math.min((lastPosition / data.duration) * 100, 100);
    if (_progress !== progress) setProgress(_progress);

    // load last location
    if (!location && data.last_location) {
      setLocation(data.last_location);
    }
  }, [data?.id, setLocation, trackingImpossible]); // eslint-disable-line

  /**
   *
   * update position
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (progress < 100) {
      intervalId = setInterval(() => {
        if (trackingImpossible) return;
        const lastPosition = lastPositionsRef.current[data.id] || 0;
        const _progress = Math.min((lastPosition / data.duration) * 100, 100);
        if (_progress !== progress) setProgress(_progress);

        if ((_progress >= data.cutoff_progress && progress < data.cutoff_progress) || (_progress >= 100 && progress < 100)) {
          throttlePersistWatch(data.id);
        }

        if (lastPosition >= data.duration) {
          if (intervalId) clearInterval(intervalId);
          return;
        }
        lastPositionsRef.current[data.id] = lastPosition + 1;
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [data.id, trackingImpossible, data.duration, progress, data.cutoff_progress, throttlePersistWatch]);

  /**
   *
   * handle beforeunload, pagehide, visibilitychange
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    // persist watch event wrapper
    const eventWrapper = (e: Event) => {
      if (e.type === 'visibilitychange') {
        if (document.visibilityState !== 'hidden') return;
        persistWatch(data.id, location);
      } else {
        throttlePersistWatch(data.id);
      }
    };

    // add event listener
    PERSIST_EVENT.forEach((event) => {
      window.removeEventListener(event, eventWrapper);
      window.addEventListener(event, eventWrapper);
    });

    return () => {
      // persist watch
      throttlePersistWatch(data.id);

      // clean up
      PERSIST_EVENT.forEach((event) => {
        window.removeEventListener(event, eventWrapper);
      });
    };
  }, [data.id, trackingImpossible, location, throttlePersistWatch, persistWatch]);

  if (!user) return null;
  if (!data?.duration) return null;
  if (data.duration > MAX_WATCH_DURATION) return null;

  if (hidden) return <></>;

  return (
    <Tooltip title={`${toFixedHuman(progress, 1)}% / ${formatDuration(data.duration)}`} placement="bottom">
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          pointerEvents: 'auto',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          bgcolor: 'action.disalbedBackground',
          zIndex: 3,
          ...sx,
        }}
        color={progress > data.cutoff_progress ? 'success' : 'warning'}
      />
    </Tooltip>
  );
};
