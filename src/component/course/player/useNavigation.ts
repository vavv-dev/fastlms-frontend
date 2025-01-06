import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { courseResourceLocationState } from '..';
import { useEmonCourseControl } from '../emon/useEmonCourseControl';
import { checkResourceAccessible } from './util'; // eslint-disable-line

import { ResourceLocation } from '@/api';

interface ResourceMeta {
  title: string;
  passed: boolean | null;
  status: string | null;
}

const createResourceKey = (resource: ResourceLocation | null): string | null => {
  if (!resource) return null;
  return `${resource.lesson_id}::${resource.resource_id}`;
};

const createResourceFromKey = (key: string): ResourceLocation | null => {
  const parts = key.split('::');
  if (parts.length !== 2) return null;
  const [lessonId, resourceId] = parts;
  return { lesson_id: lessonId, resource_id: resourceId };
};

interface NavigationHookResult {
  resourceLocation: ResourceLocation | null;
  setResourceLocation: (resource: ResourceLocation | null, showMessage?: boolean) => void;
  handleForward: () => void;
  handleBackward: () => void;
  canForward: boolean;
  canBackward: boolean;
}

const validateResourceLocation = (location: ResourceLocation | null, indices: Record<string, number>): boolean => {
  if (!location) return false;
  const key = createResourceKey(location);
  if (!key) return false;
  return key in indices;
};

export const useNavigation = (
  indices: Record<string, number>,
  metas: Record<string, ResourceMeta>,
  resourceCount: number,
  startLocation: ResourceLocation | null,
  sequentialLearning: boolean,
  setPlayerMessage: (message: string) => void,
  courseId: string | null,
  emonManagedCourse: boolean | null = false,
): NavigationHookResult => {
  const { t } = useTranslation('course');
  const setCourseResourceLocation = useSetAtom(courseResourceLocationState);
  const [resourceLocation, _setResourceLocation] = useState<ResourceLocation | null>(null);
  const currentKey = useMemo(() => createResourceKey(resourceLocation), [resourceLocation]);

  // emon course control
  const { updateResourceLocation } = useEmonCourseControl(courseId);

  const checkPreviousResourceCompleted = useCallback(
    (key: string): boolean => {
      return checkResourceAccessible(key, indices, metas, sequentialLearning);
    },
    [indices, metas, sequentialLearning],
  );

  const setResourceLocation = useCallback(
    (newLocation: ResourceLocation | null, showWarning = true) => {
      if (Object.keys(indices).length === 0 || Object.keys(metas).length === 0) return;

      const findLastAccessibleResource = () => {
        const orderedKeys = Object.entries(indices)
          .sort(([, indexA], [, indexB]) => indexA - indexB)
          .map(([key]) => key);
        let lastAccessibleKey: string | null = null;
        for (const k of orderedKeys) {
          if (checkPreviousResourceCompleted(k)) {
            lastAccessibleKey = k;
          } else {
            break;
          }
        }
        return lastAccessibleKey ? createResourceFromKey(lastAccessibleKey) : null;
      };

      let locationToSet = newLocation;
      if (!locationToSet) {
        if (sequentialLearning) {
          const firstIncompleteKey = Object.keys(indices).find((k) => {
            const meta = metas[k];
            return meta?.passed !== true && meta?.status !== 'grading';
          });
          locationToSet = firstIncompleteKey ? createResourceFromKey(firstIncompleteKey) : null;
        } else {
          const firstKey = Object.keys(indices).find((k) => indices[k] === 0);
          locationToSet = firstKey ? createResourceFromKey(firstKey) : null;
        }
      }

      const key = createResourceKey(locationToSet);
      if (!key || !validateResourceLocation(locationToSet, indices)) {
        locationToSet = findLastAccessibleResource();
      } else if (sequentialLearning && !checkPreviousResourceCompleted(key)) {
        if (showWarning) {
          setPlayerMessage(t('You must proceed in order.'));
        }
        locationToSet = findLastAccessibleResource();
      }

      if (!locationToSet) {
        return;
      }

      if (emonManagedCourse) {
        updateResourceLocation?.(locationToSet, _setResourceLocation);
      } else {
        _setResourceLocation(locationToSet);
      }
    },
    [
      indices,
      metas,
      sequentialLearning,
      checkPreviousResourceCompleted,
      t,
      setPlayerMessage,
      updateResourceLocation,
      emonManagedCourse,
    ],
  );

  useEffect(() => {
    if (!resourceLocation) return;
    setCourseResourceLocation(resourceLocation);
  }, [resourceLocation, setCourseResourceLocation]);

  useEffect(() => {
    if (resourceLocation) return;
    setResourceLocation(startLocation);
  }, [startLocation, setResourceLocation, resourceLocation]);

  const handleForward = useCallback(() => {
    if (!currentKey) return;
    const currentIndex = indices[currentKey];
    const nextKey = Object.keys(indices).find((key) => indices[key] === currentIndex + 1);
    if (nextKey) {
      setResourceLocation(createResourceFromKey(nextKey));
    }
  }, [currentKey, indices, setResourceLocation]);

  const handleBackward = useCallback(() => {
    if (!currentKey) return;
    const currentIndex = indices[currentKey];
    const prevKey = Object.keys(indices).find((key) => indices[key] === currentIndex - 1);
    if (prevKey) {
      setResourceLocation(createResourceFromKey(prevKey));
    }
  }, [currentKey, indices, setResourceLocation]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!currentKey) return;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          handleForward();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          handleBackward();
          break;
      }
    },
    [currentKey, handleForward, handleBackward],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const canForward = useMemo(() => {
    if (!currentKey || indices[currentKey] >= resourceCount - 1) return false;
    if (!sequentialLearning) return true;
    const meta = metas[currentKey];
    return meta?.passed === true || meta?.status === 'grading';
  }, [currentKey, indices, resourceCount, sequentialLearning, metas]);

  return {
    resourceLocation,
    setResourceLocation,
    handleForward,
    handleBackward,
    canForward,
    canBackward: currentKey ? indices[currentKey] > 0 : false,
  };
};
