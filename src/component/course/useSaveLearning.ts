import { useCallback, useEffect, useRef } from 'react';

import type { ResourceLocation } from '@/api';
import { courseUpdateLearning as updateLearning } from '@/api';

interface SaveLearningParams {
  courseId: string;
  progress?: number | null;
  score?: number | null;
  passed?: boolean | null;
  resourceLocation: ResourceLocation | null;
  onSuccess?: (resourceLocation: ResourceLocation) => void;
}

export const useSaveLearning = (params: SaveLearningParams | false | undefined) => {
  const saveRef = useRef<(() => void) | null>(null);
  const prevValueRef = useRef<Omit<SaveLearningParams, 'courseId' | 'onSuccess'> | null>(null);

  const save = useCallback(() => {
    if (!params || !params.courseId || !params.resourceLocation) return;

    const { courseId, progress, score, passed, resourceLocation, onSuccess } = params;

    const hasChanged =
      prevValueRef.current?.progress !== progress ||
      prevValueRef.current?.score !== score ||
      prevValueRef.current?.passed !== passed ||
      prevValueRef.current?.resourceLocation?.lesson_id !== resourceLocation.lesson_id ||
      prevValueRef.current?.resourceLocation?.resource_id !== resourceLocation.resource_id;

    if (!hasChanged) return;

    prevValueRef.current = {
      progress,
      score,
      passed,
      resourceLocation,
    };

    updateLearning({
      id: courseId,
      requestBody: {
        progress,
        score,
        passed,
        resource_location: resourceLocation,
      },
    })
      .then(() => onSuccess?.(resourceLocation))
      .catch(() => null);
  }, [params]);

  useEffect(() => {
    saveRef.current = save;
    save();
  }, [save]);

  useEffect(
    () => () => {
      saveRef.current?.();
    },
    [],
  );

  useEffect(() => {
    const handleBeforeUnload = () => saveRef.current?.();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { save };
};
