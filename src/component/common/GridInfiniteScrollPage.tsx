import { CancelablePromise } from '@/api';
import { InfiniteScrollIndicator, PaginationActions, useInfinitePagination } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { Add } from '@mui/icons-material';
import { Box, BoxProps, Button, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const tabFamily = atomFamily(() => atom<string | undefined>(undefined));
const orderingFamily = atomFamily(() => atom<string>(''));
const searchFamily = atomFamily(() => atom<string>(''));

interface PaginatedList<T> {
  page: number;
  pages: number;
  size: number;
  total: number;
  items: T[];
}

interface GridInfiniteScrollPageProps<Item, Params extends { orderBy?: string }> {
  pageKey: string;
  apiService: (params: Params) => CancelablePromise<PaginatedList<Item>>;
  renderItem: (props: { data: PaginatedList<Item>[] | undefined; tab?: string }) => React.ReactNode;
  gridBoxSx: BoxProps['sx'];
  tabConfig?: {
    sharedItemTabKey: string;
    sharedItemTabLabel: string;
    ownedItemTabLabel: string;
    queryValue?: string;
  };
  orderingOptions?: { value: Params['orderBy']; label: string }[];
  disableSearch?: boolean;
  CreateItemComponent?: React.ComponentType<{
    open: boolean;
    setOpen: (open: boolean) => void;
  }>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  apiOptions?: Params;
  pageHeader?: React.ReactNode;
  boxPadding?: number;
  extraAction?: React.ReactNode | ((tab: string | undefined) => React.ReactNode);
}

const GridInfiteScrollPage = <Item, Params extends { orderBy?: string }>({
  pageKey,
  tabConfig,
  orderingOptions,
  disableSearch,
  CreateItemComponent,
  apiService,
  apiOptions,
  renderItem,
  maxWidth,
  gridBoxSx,
  pageHeader,
  boxPadding,
  extraAction,
}: GridInfiniteScrollPageProps<Item, Params>) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const homeUser = useAtomValue(homeUserState);
  const user = useAtomValue(userState);
  const [tab, setTab] = useAtom(tabFamily(pageKey));
  const [ordering, setOrdering] = useAtom(orderingFamily(pageKey));
  const [search, setSearch] = useAtom(searchFamily(pageKey));
  const [createItemDialogOpen, setCreateItemDialogOpen] = useState(false);

  const userID = homeUser?.id;
  const isOwner = user && user?.id === userID;
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isValidating, mutate } = useInfinitePagination<Params, PaginatedList<Item>>({
    apiOptions: (!tab
      ? undefined
      : {
          [tabConfig ? tab : 'owner']: tabConfig?.queryValue || userID,
          orderBy: ordering ? ordering : orderingOptions?.length ? orderingOptions[0].value : '',
          search,
          ...apiOptions,
        }) as Params & undefined,
    apiService: apiService,
    infiniteScrollRef,
  });

  useEffect(() => {
    if (!ordering && orderingOptions?.length) setOrdering(orderingOptions[0].value || '');
  }, [ordering]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tabConfig) setTab('owner');
    // show home user's owned public items to visitors
    else if (!isOwner) setTab('owner');
    // set default tab
    else if (!tab) setTab(tabConfig.sharedItemTabKey);
  }, [tab, setTab, isOwner, tabConfig]);

  return (
    <Box sx={{ width: '100%', p: boxPadding == undefined ? 3 : boxPadding }}>
      <Box sx={{ display: 'block', maxWidth: maxWidth || 'lg', width: '100%', m: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            justifyContent: 'center',
            ...gridBoxSx,
          }}
        >
          {pageHeader && <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>{pageHeader}</Box>}

          <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
            <PaginationActions
              orderingOptions={orderingOptions || []}
              mutate={mutate}
              {...(disableSearch ? {} : { search, setSearch })}
              {...(orderingOptions?.length ? { ordering, setOrdering } : {})}
            >
              {typeof extraAction === 'function' ? extraAction(tab) : extraAction}
              {!!data?.length && (
                <Typography variant="subtitle2" sx={{ px: 1 }}>
                  {t('{{ count }} items', { count: data?.[0]?.total || 0 })}
                </Typography>
              )}
            </PaginationActions>

            {tabConfig && isOwner && (
              <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', my: 1 }}>
                <ToggleButtonGroup size="small" color="primary" value={tab} exclusive onChange={(_, key) => key && setTab(key)}>
                  <ToggleButton sx={{ px: 4 }} value={tabConfig.sharedItemTabKey}>
                    {tabConfig.sharedItemTabLabel}
                  </ToggleButton>
                  <ToggleButton sx={{ px: 4 }} value="owner">
                    {tabConfig.ownedItemTabLabel}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
          </Box>

          {CreateItemComponent && isOwner && tab === 'owner' && (
            <Box className="create-resource-button" sx={{ position: 'relative' }}>
              <Button
                onClick={() => setCreateItemDialogOpen(true)}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: theme.shape.borderRadius / 2,
                  aspectRatio: !data?.[0]?.total ? '1 / 1' : undefined,
                }}
              >
                {data && <Add sx={{ fontSize: '3em' }} />}
              </Button>
              <CreateItemComponent open={createItemDialogOpen} setOpen={setCreateItemDialogOpen} />
            </Box>
          )}

          {renderItem({ data, tab })}
        </Box>

        <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
      </Box>
    </Box>
  );
};

export default GridInfiteScrollPage;
