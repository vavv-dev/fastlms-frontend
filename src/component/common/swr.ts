import { INFINITE_PREFIX, cache as globalCache, mutate as globalMutate } from 'swr/_internal';

import { GradingEnum, LessonGetDisplaysResponse, SharedGetDisplaysResponse, lessonGetDisplays, sharedGetDisplays } from '@/api';

const ServiceType = {
  LESSON_DISPLAYS: 'lessonGetDisplays',
  SHARED_DISPLAYS: 'sharedGetDisplays',
} as const;

type NestedItem<T> = T & { [field: string]: Array<T> };
type UpdaterFunction<T> = (item: T) => T;

interface ResourceDisplay {
  id: number | string;
  kind: string;
  progress?: number;
  score?: number;
  passed?: boolean;
}

interface Lesson {
  id: number | string;
  grading_method: GradingEnum;
  resource_displays: ResourceDisplay[];
  progress?: number | null;
  score?: number | null;
  passed?: boolean | null;
}

const calculateLessonMetrics = (lesson: Lesson): Partial<Lesson> => {
  const gradingKinds = lesson.grading_method === 'progress' ? ['video', 'asset'] : ['quiz', 'exam'];
  const relevantDisplays = lesson.resource_displays.filter((r) => gradingKinds.includes(r.kind));

  if (relevantDisplays.length === 0) {
    return { progress: null, score: null, passed: null };
  }

  let metrics: Partial<Lesson> = {};

  if (lesson.grading_method === 'progress') {
    const total = relevantDisplays.reduce((sum, r) => sum + (r.progress || 0), 0);
    metrics.progress = total / relevantDisplays.length;
  }

  if (lesson.grading_method === 'score') {
    const total = relevantDisplays.reduce((sum, r) => sum + (r.score || 0), 0);
    metrics.score = total / relevantDisplays.length;
  }

  if (lesson.grading_method !== 'none') {
    const passed = relevantDisplays.map((r) => r.passed);
    metrics.passed = passed.length > 0 ? passed.every((p) => p) : null;
  }

  return metrics;
};

export const updateInfiniteCache = <T extends { id: number | string }>(
  listService: () => Promise<{ items: T[]; page: number; total: number }>,
  itemOrUpdater: Partial<T | NestedItem<T>> | UpdaterFunction<T>,
  mode: 'update' | 'create' | 'delete',
  children?: string,
  isPin?: boolean,
  skipAccountHistory?: boolean,
  skipLessonDisplays?: boolean,
) => {
  const getItemId = () => {
    if (typeof itemOrUpdater === 'object') {
      return itemOrUpdater.id;
    }
    return null;
  };

  const updateNestedItems = (items: T[]): T[] => {
    let found = undefined;
    const newItems = items
      .map((i) => {
        if (typeof itemOrUpdater === 'function') {
          found = itemOrUpdater(i);
          return mode === 'delete' ? null : found;
        } else {
          const targetId = getItemId();
          if (targetId !== null && i.id === targetId) {
            found = { ...i, ...itemOrUpdater };
            return mode === 'delete' ? null : found;
          }
        }
        if (children && Array.isArray(i[children as keyof T])) {
          const updatedItem = { ...i, [children]: updateNestedItems(i[children as keyof T] as Array<T>) };

          if (listService.name === ServiceType.LESSON_DISPLAYS && children === 'resource_displays') {
            const metrics = calculateLessonMetrics(updatedItem as unknown as Lesson);
            return { ...updatedItem, ...metrics };
          }

          return updatedItem;
        }
        return i;
      })
      .filter(Boolean) as T[];
    const targetId = getItemId();
    return isPin && found && targetId ? [found, ...newItems.filter((i) => i.id !== targetId)] : newItems;
  };

  Array.from(globalCache.keys()).forEach((key) => {
    if (key.startsWith(`${INFINITE_PREFIX}${listService.name}`)) {
      const data: Array<{ items: T[]; page: number; total: number }> = globalCache.get(key)?.data;
      let updated = data;
      if (mode === 'update' || mode === 'delete') {
        updated = data.map((d) => ({
          ...d,
          items: updateNestedItems(d.items),
          total: mode === 'delete' ? d.total - 1 : d.total,
        }));
      } else if (mode === 'create') {
        if (typeof itemOrUpdater === 'function') {
          throw new Error('Create mode does not support updater function');
        }
        if (data && data.length > 0) {
          updated = [
            {
              ...data[0],
              items: [itemOrUpdater as T, ...data[0].items],
              total: data[0].total + 1,
            },
            ...data.slice(1),
          ];
        } else {
          updated = [
            {
              items: [itemOrUpdater as T],
              page: 1,
              total: 1,
            },
          ];
        }
      }
      globalMutate(key, updated, { revalidate: false });
    }
  });

  try {
    if (!skipAccountHistory && listService.name !== ServiceType.SHARED_DISPLAYS && mode !== 'create') {
      updateInfiniteCache(
        sharedGetDisplays,
        typeof itemOrUpdater === 'function'
          ? (itemOrUpdater as unknown as UpdaterFunction<SharedGetDisplaysResponse['items'][0]>)
          : (itemOrUpdater as unknown as SharedGetDisplaysResponse['items'][0]),
        mode,
        'items',
        undefined,
        true,
        skipLessonDisplays,
      );
    }

    if (!skipLessonDisplays && listService.name !== ServiceType.LESSON_DISPLAYS && mode !== 'create') {
      const transformLessonData = (
        data: any, // eslint-disable-line
      ) => {
        if (typeof data === 'function') {
          return (lesson: LessonGetDisplaysResponse['items'][0]) => {
            const updatedLesson = {
              ...lesson,
              resource_displays: data(lesson.resource_displays),
            };
            return updatedLesson;
          };
        }
        return {
          ...data,
          resource_displays: Array.isArray(data.items) ? data.items : data.resource_displays,
        };
      };

      updateInfiniteCache(
        lessonGetDisplays,
        transformLessonData(itemOrUpdater),
        mode,
        'resource_displays',
        undefined,
        skipAccountHistory,
        true,
      );
    }
  } catch (e) {
    void e;
  }
};
