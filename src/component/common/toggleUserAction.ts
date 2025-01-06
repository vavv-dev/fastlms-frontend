import { updateInfiniteCache } from './swr';

import { CancelablePromise } from '@/api';

const userActions = { bookmark: 'bookmarked', like: 'liked', flag: 'flagged' } as const;

type Action = keyof typeof userActions;
type ActionPast = (typeof userActions)[Action];

type ToggleableItem<IDType extends string | number = string> = {
  id: IDType;
} & {
  [K in ActionPast]: boolean;
} & {
  [K in `${Action}_count`]: number;
};

type ToggleActionData<IDType extends string | number = string> = {
  id: IDType;
  action: Action;
  accessToken?: string;
  refreshToken?: string;
};

export const createToggleAction = <T extends ToggleableItem<string | number>>(
  toggleActionFn: (data: ToggleActionData<T['id']>) => CancelablePromise<unknown>,
  getDisplayFn: () => Promise<{ items: T[]; page: number; total: number }>,
  children?: boolean,
) => {
  return (action: Action, item: T) => {
    const pastAction = userActions[action];
    const pastActionCount = item[`${action}_count`] || 0;
    toggleActionFn({ id: item.id, action })
      .then(() =>
        updateInfiniteCache<T>(
          getDisplayFn,
          {
            id: item.id,
            [pastAction]: !item[pastAction],
            [`${action}_count`]: pastActionCount + (item[pastAction] ? -1 : 1),
          } as Partial<T>,
          'update',
          children ? 'children' : undefined,
        ),
      )
      .catch(console.error);
  };
};
