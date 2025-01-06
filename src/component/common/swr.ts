import { INFINITE_PREFIX, cache as globalCache, mutate as globalMutate } from 'swr/_internal';

import {
  GradingMethodEnum,
  LessonGetDisplaysResponse,
  SharedGetDisplaysResponse,
  lessonGetDisplays,
  sharedGetDisplays,
} from '@/api';

type NestedItem<T> = T & { [field: string]: Array<T> };
type UpdaterFunction<T> = (item: T) => T;

interface ResourceDisplay {
  id: number | string;
  kind: string;
  progress?: number;
  score?: number;
  passed?: boolean;
  grading_method: GradingMethodEnum;
}

interface Lesson {
  id: number | string;
  grading_method: GradingMethodEnum;
  resource_displays: ResourceDisplay[];
  progress?: number | null;
  score?: number | null;
  passed?: boolean | null;
}

const calculateLessonMetrics = (lesson: Lesson): Partial<Lesson> => {
  // Null check for resource_displays
  if (!lesson?.resource_displays) {
    return {
      progress: lesson.progress ?? null,
      score: lesson.score ?? null,
      passed: lesson.passed ?? null,
    };
  }

  const relevantDisplays = lesson.resource_displays.filter((r) => r.grading_method === lesson.grading_method);

  if (relevantDisplays.length === 0) {
    return {
      progress: lesson.progress ?? null,
      score: lesson.score ?? null,
      passed: lesson.passed ?? null,
    };
  }

  let metrics: Partial<Lesson> = {};

  if (lesson.grading_method === 'progress') {
    const total = relevantDisplays.reduce((sum, r) => sum + (r.progress ?? 0), 0);
    metrics.progress = total / relevantDisplays.length;
    metrics.passed = relevantDisplays.every((r) => r.passed);
  }

  if (lesson.grading_method === 'score') {
    const total = relevantDisplays.reduce((sum, r) => sum + (r.score ?? 0), 0);
    metrics.score = total / relevantDisplays.length;
    metrics.passed = relevantDisplays.every((r) => r.passed);
  }

  return {
    progress: metrics.progress ?? lesson.progress ?? null,
    score: metrics.score ?? lesson.score ?? null,
    passed: metrics.passed ?? lesson.passed ?? null,
  };
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
    if (typeof itemOrUpdater === 'object' && itemOrUpdater !== null) {
      return itemOrUpdater.id;
    }
    return null;
  };

  const updateNestedItems = (items: T[]): T[] => {
    if (!Array.isArray(items)) {
      return [];
    }

    let found: T | undefined = undefined;
    const newItems = items
      .map((i) => {
        if (!i) return null;

        if (typeof itemOrUpdater === 'function') {
          try {
            found = itemOrUpdater(i);
            return mode === 'delete' ? null : found;
          } catch (error) {
            console.error('Error in updater function:', error);
            return i;
          }
        } else if (itemOrUpdater !== null) {
          const targetId = getItemId();
          if (targetId !== null && i.id === targetId) {
            if (listService.name === 'lessonGetDisplays') {
              found = {
                ...i,
                ...itemOrUpdater,
                resource_displays: (i as unknown as Lesson).resource_displays || [],
              } as T;
            } else {
              found = { ...i, ...itemOrUpdater } as T;
            }
            return mode === 'delete' ? null : found;
          }
        }

        if (children && i[children as keyof T] && Array.isArray(i[children as keyof T])) {
          const updatedItem = { ...i, [children]: updateNestedItems(i[children as keyof T] as Array<T>) };

          if (listService.name === 'lessonGetDisplays' && children === 'resource_displays') {
            const metrics = calculateLessonMetrics(updatedItem as unknown as Lesson);
            return { ...updatedItem, ...metrics };
          }

          return updatedItem;
        }
        return i;
      })
      .filter(Boolean) as T[];

    const targetId = getItemId();
    return isPin && found && targetId ? [found, ...newItems.filter((i) => i?.id !== targetId)] : newItems;
  };

  try {
    Array.from(globalCache.keys()).forEach((key) => {
      if (key.startsWith(`${INFINITE_PREFIX}${listService.name}`)) {
        const cachedData = globalCache.get(key);
        if (!cachedData?.data) return;

        const data: Array<{ items: T[]; page: number; total: number }> = cachedData.data;
        let updated = data;

        if (mode === 'update' || mode === 'delete') {
          updated = data.map((d) => ({
            ...d,
            items: updateNestedItems(d.items),
            total: mode === 'delete' ? Math.max(0, d.total - 1) : d.total,
          }));
        } else if (mode === 'create') {
          if (typeof itemOrUpdater === 'function') {
            throw new Error('Create mode does not support updater function');
          }
          if (data && data.length > 0) {
            const newItemId = (itemOrUpdater as T).id;
            const itemExists = data.some((page) => page.items.some((item) => item.id === newItemId));

            if (!itemExists) {
              updated = [
                {
                  ...data[0],
                  items: [itemOrUpdater as T, ...data[0].items],
                  total: data[0].total + 1,
                },
                ...data.slice(1),
              ];
            } else {
              updated = data;
            }
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

    // Handle related cache updates
    if (!skipAccountHistory && listService.name !== 'sharedGetDisplays' && mode !== 'create') {
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

    if (!skipLessonDisplays && listService.name !== 'lessonGetDisplays' && mode !== 'create') {
      const transformLessonData = (
        data: any, // eslint-disable-line
      ): UpdaterFunction<LessonGetDisplaysResponse['items'][0]> | Partial<LessonGetDisplaysResponse['items'][0]> => {
        if (typeof data === 'function') {
          return (lesson: LessonGetDisplaysResponse['items'][0]) => {
            const updatedLesson = {
              ...lesson,
              resource_displays: data(lesson.resource_displays) || [],
            };
            return updatedLesson;
          };
        }
        return {
          ...data,
          resource_displays: Array.isArray(data.items) ? data.items : data.resource_displays || [],
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
  } catch (error) {
    console.error('Error in updateInfiniteCache:', error);
  }
};
