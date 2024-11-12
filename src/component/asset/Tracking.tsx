import { Box } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import throttle from 'lodash/throttle';
import { useCallback, useEffect, useRef } from 'react';

import { pageFamily } from '.';

import {
  AssetDisplayResponse as DisplayResponse,
  AssetGetWatchBitmapData as GetWatchBitmapData,
  AssetGetWatchBitmapResponse as GetWatchBitmapResponse,
  AssetWatchUpdateRequest as WatchUpdateRequest,
  assetGetDisplays as getDisplays,
  assetGetWatchBitmap as getWatchBitmap,
  assetStartWatch as startWatch,
  assetUpdateWatch as updateWatch,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { userState } from '@/store';

const PERSIST_EVENT = ['beforeunload', 'pagehide', 'visibilitychange'];
const MAX_WATCH_DURATION = 60 * 60 * 3; // 3 hours
const DEBOUNCE_THROTTLE = 500;

const lastPositions = {};

export const Tracking = ({ data }: { data: DisplayResponse }) => {
  const user = useAtomValue(userState);
  const lastPositionsRef = useRef<Record<string, number>>(lastPositions);
  const { data: watchBitmap, mutate } = useServiceImmutable<GetWatchBitmapData, GetWatchBitmapResponse>(getWatchBitmap, {
    id: data.progress != null ? data.id : '',
  });

  // for epub/pdf...
  const locationRef = useRef<string | null>(null);
  const [location, setLocation] = useAtom(pageFamily(data.url));

  useEffect(() => {
    if (!location) return;
    locationRef.current = String(location);
  }, [location]);

  // no need to save last position
  const trackingImpossible = !data || !data.duration || data.duration > MAX_WATCH_DURATION || (data.progress || 0) >= 100;

  useEffect(() => {
    if (trackingImpossible || !watchBitmap) return;

    // calculate watched seconds from watchBitmap and update lastPositions
    watchBitmap.arrayBuffer().then((arrayBuffer) => {
      const uint8Array = new Uint8Array(arrayBuffer);

      // watch bitmap to bit array
      const watchBitmapArray = [];
      for (let i = 0; i < uint8Array.length; i++) {
        const byte = uint8Array[i];
        for (let j = 7; j >= 0; j--) {
          const bit = (byte >> j) & 1;
          watchBitmapArray.push(bit);
        }
      }

      // update watched seconds
      const watchedSeconds = watchBitmapArray.reduce((acc, bit) => acc + bit, 0);
      lastPositionsRef.current[data.id] = watchedSeconds;
    });
  }, [watchBitmap]); // eslint-disable-line

  /**
   *
   * initialize watch bitmap
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;
    // watch bitmap
    if (!lastPositionsRef.current[data.id]) {
      // if first watch, save first watch time
      if (data.progress === null) throttlePersistWatch(data.id);
      lastPositionsRef.current[data.id] = 0;
    }

    // load last location
    if (!location && data.last_location) {
      setLocation(data.last_location);
    }
  }, [data?.id, setLocation]); // eslint-disable-line

  /**
   *
   * update position
   *
   */
  useEffect(() => {
    // update last position by every 1 second
    const interval = setInterval(() => {
      if (trackingImpossible) return;
      // update last position
      const lastPosition = lastPositionsRef.current[data.id] || 0;
      if (lastPosition >= data.duration) return;
      lastPositionsRef.current[data.id] = lastPosition + 1;
    }, 1000);

    return () => clearInterval(interval);
  }, [data.id]); // eslint-disable-line

  /**
   *
   * handle beforeunload, pagehide, visibilitychange
   *
   */
  useEffect(() => {
    if (trackingImpossible) return;

    // persist watch event wrapper
    const eventWrapper = (e: Event) => {
      if (e.type === 'visibilitychange' && !(document.visibilityState === 'hidden')) {
        return;
      }
      throttlePersistWatch(data.id);
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
  }, [data.id]); // eslint-disable-line

  /**
   *
   * Persist
   *
   */
  const persistWatch = useCallback(
    async (id: string) => {
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
      if (locationRef.current) {
        watch['last_location'] = String(locationRef.current);
      }

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
          // update watch cache
          mutate(new Blob([bitmap]), { revalidate: false });
          // update list cache
          const progress = (lastPosition / data.duration) * 100;
          const updated = {
            id: id,
            progress: Math.min(progress, 100),
            passed: progress >= data.cutoff_progress,
          };
          updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
        })
        .catch((e) => console.error(e));
    },
    [data, mutate, locationRef, trackingImpossible],
  );

  // debounce persist watch
  const throttlePersistWatch = throttle((id: string) => persistWatch(id), DEBOUNCE_THROTTLE);

  if (!user) return null;
  if (!data?.duration) return null;
  if (data.duration > MAX_WATCH_DURATION) return null;

  return <Box sx={{ position: 'absolute', bottom: 0, right: '50%', zIndex: 1000 }}></Box>;
};
