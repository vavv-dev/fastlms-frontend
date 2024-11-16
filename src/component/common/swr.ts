import { INFINITE_PREFIX, cache as globalCache, mutate as globalMutate } from 'swr/_internal';

import { LessonGetDisplaysResponse, SharedGetDisplaysResponse, lessonGetDisplays, sharedGetDisplays } from '@/api';

type NestedItem<T> = T & { [field: string]: Array<T> };
type UpdaterFunction<T> = (item: T) => T;

export const updateInfiniteCache = <T extends { id: number | string }>(
  listService: () => Promise<{ items: T[]; page: number; total: number }>,
  itemOrUpdater: Partial<T | NestedItem<T>> | UpdaterFunction<T>,
  mode: 'update' | 'create' | 'delete',
  children?: string,
  isPin?: boolean,
  skipAccountHistory?: boolean,
  skipLessonHistory?: boolean,
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
          return { ...i, [children]: updateNestedItems(i[children as keyof T] as Array<T>) };
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
    // Update shared displays cache
    if (!skipAccountHistory && listService.name !== 'sharedGetDisplays' && mode !== 'create') {
      updateInfiniteCache(
        sharedGetDisplays,
        typeof itemOrUpdater === 'function'
          ? (itemOrUpdater as unknown as UpdaterFunction<SharedGetDisplaysResponse['items'][0]>)
          : (itemOrUpdater as unknown as SharedGetDisplaysResponse['items'][0]),
        mode,
        'items', // items field for shared displays
        undefined,
        true,
        skipLessonHistory,
      );
    }

    // Update lesson displays cache
    if (!skipLessonHistory && listService.name !== 'lessonGetDisplays' && mode !== 'create') {
      // For lesson displays, we need to modify the data structure
      const transformLessonData = (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof data === 'function') {
          return (lesson: LessonGetDisplaysResponse['items'][0]) => ({
            ...lesson,
            resource_displays: data(lesson.resource_displays),
          });
        }
        return {
          ...data,
          resource_displays: Array.isArray(data.items) ? data.items : data.resource_displays,
        };
      };

      updateInfiniteCache(
        lessonGetDisplays,
        transformLessonData(itemOrUpdater) as UpdaterFunction<LessonGetDisplaysResponse['items'][0]>,
        mode,
        'resource_displays', // resource_displays field for lesson displays
        undefined,
        skipAccountHistory,
        true,
      );
    }
  } catch (e) {
    void e;
  }
};
