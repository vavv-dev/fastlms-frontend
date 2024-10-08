import { AccountGetHistoryResponse, accountGetHistory } from '@/api';
import { INFINITE_PREFIX, cache as globalCache, mutate as globalMutate } from 'swr/_internal';

type NestedItem<T> = T & { [field: string]: Array<T> };

export const updateInfiniteCache = <T extends { id: number | string }>(
  listService: () => Promise<{ items: T[]; page: number; total: number }>,
  item: Partial<T | NestedItem<T>>,
  mode: 'update' | 'create' | 'delete',
  children?: string,
  isPin?: boolean,
  skipAccountHistory?: boolean,
) => {
  const updateNestedItems = (items: T[]): T[] => {
    let found = undefined;
    const newItems = items
      .map((i) => {
        if (i.id === item.id) {
          found = { ...i, ...item };
          return mode === 'delete' ? null : found;
        }
        if (children && Array.isArray(i[children as keyof T])) {
          return { ...i, [children]: updateNestedItems(i[children as keyof T] as Array<T>) };
        }
        return i;
      })
      .filter(Boolean) as T[];
    return isPin && found ? [found, ...newItems.filter((i) => i.id !== item.id)] : newItems;
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
        updated = [{ ...data[0], items: [item as T, ...data[0].items], total: data[0].total + 1 }, ...data.slice(1)];
      }
      globalMutate(key, updated, { revalidate: false });
    }
  });

  try {
    if (!skipAccountHistory && listService.name !== 'accountGetHistory' && mode !== 'create') {
      updateInfiniteCache(
        accountGetHistory,
        item as unknown as AccountGetHistoryResponse['items'][0],
        mode,
        undefined,
        undefined,
        true,
      );
    }
  } catch (e) {
    console.warn('Error updating accountGetHistory cache:', e);
  }
};
