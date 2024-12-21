import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { courseResourceLocationState, playerMessageState } from '..';
import { checkResourceAccessible } from './util';

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
  canGoForward: boolean;
  canGoBackward: boolean;
}

const validateResourceLocation = (location: ResourceLocation | null, indices: Record<string, number>): boolean => {
  if (!location) return false;
  const key = createResourceKey(location);
  if (!key) return false;
  return key in indices;
};

const getInitialResource = (
  startLocation: ResourceLocation | null,
  indices: Record<string, number>,
  metas: Record<string, ResourceMeta>,
  sequentialLearning: boolean,
): ResourceLocation | null => {
  if (!validateResourceLocation(startLocation, indices)) {
    return null;
  }

  if (!sequentialLearning) {
    return startLocation;
  }

  const key = createResourceKey(startLocation);
  if (!key) return null;

  if (checkResourceAccessible(key, indices, metas, sequentialLearning)) {
    return startLocation;
  }

  const firstIncompleteKey = Object.keys(indices).find((k) => {
    const meta = metas[k];
    return meta?.passed !== true && meta?.status !== 'grading';
  });
  return firstIncompleteKey ? createResourceFromKey(firstIncompleteKey) : null;
};

export const useNavigation = (
  indices: Record<string, number>,
  metas: Record<string, ResourceMeta>,
  resourceCount: number,
  startLocation: ResourceLocation | null,
  sequentialLearning: boolean,
): NavigationHookResult => {
  const { t } = useTranslation('course');
  const setPlayerMessage = useSetAtom(playerMessageState);
  const setCourseResourceLocation = useSetAtom(courseResourceLocationState);

  const [resourceLocation, _setResourceLocation] = useState<ResourceLocation | null>(() => {
    const initial = getInitialResource(startLocation, indices, metas, sequentialLearning);
    if (sequentialLearning && initial !== startLocation) {
      setPlayerMessage(t('You must proceed in order.'));
    }
    setCourseResourceLocation(initial);
    return initial;
  });

  const currentKey = useMemo(() => createResourceKey(resourceLocation), [resourceLocation]);

  const checkPreviousResourceCompleted = useCallback(
    (key: string): boolean => {
      return checkResourceAccessible(key, indices, metas, sequentialLearning);
    },
    [indices, metas, sequentialLearning],
  );

  const setResourceLocation = useCallback(
    (newLocation: ResourceLocation | null, showWarning = true) => {
      if (!newLocation) {
        _setResourceLocation(null);
        setCourseResourceLocation(null);
        return;
      }

      const newKey = createResourceKey(newLocation);
      if (!newKey || !validateResourceLocation(newLocation, indices)) return;

      if (!checkPreviousResourceCompleted(newKey)) {
        if (showWarning) {
          setPlayerMessage(t('You must proceed in order.'));
        }
        return;
      }

      _setResourceLocation(newLocation);
      setCourseResourceLocation(newLocation);
    },
    [indices, checkPreviousResourceCompleted, t, setPlayerMessage, setCourseResourceLocation],
  );

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

  const canGoForward = useMemo(() => {
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
    canGoForward,
    canGoBackward: currentKey ? indices[currentKey] > 0 : false,
  };
};
