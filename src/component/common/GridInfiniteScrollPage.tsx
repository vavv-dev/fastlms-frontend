import { Add } from '@mui/icons-material';
import { Box, BoxProps, Button, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollRestoration, useLocation } from 'react-router-dom';
import { SWRInfiniteConfiguration } from 'swr/infinite';

import { CancelablePromise } from '@/api';
import { InfiniteScrollIndicator, PaginationActions, searchFamily, useInfinitePagination } from '@/component/common';
import { spacerRefState } from '@/component/layout';
import { channelState, userState } from '@/store';

const orderingFamily = atomFamily(() => atom<string>(''));

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
  renderItem: (props: { data: PaginatedList<Item>[] | undefined }) => React.ReactNode;
  emptyMessage: React.ReactNode;
  gridBoxSx: BoxProps['sx'];
  orderingOptions?: { value: Params['orderBy']; label: string }[];
  disableSearch?: boolean;
  CreateItemComponent?: React.ComponentType<{
    open: boolean;
    setOpen: (open: boolean) => void;
    refresh?: () => void;
  }>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'inherit' | number;
  apiOptions?: Params;
  pageHeader?: React.ReactNode;
  boxPadding?: BoxProps['p'];
  extraAction?: React.ReactNode;
  extraFilter?: React.ReactNode;
  disableSticky?: boolean;
  swrInfiniteOption?: SWRInfiniteConfiguration;
}

export const GridInfiniteScrollPage = <Item, Params extends { orderBy?: string }>({
  pageKey,
  orderingOptions,
  disableSearch,
  CreateItemComponent,
  apiService,
  apiOptions,
  renderItem,
  emptyMessage,
  maxWidth,
  gridBoxSx,
  pageHeader,
  boxPadding,
  extraAction,
  extraFilter,
  disableSticky,
  swrInfiniteOption,
}: GridInfiniteScrollPageProps<Item, Params>) => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const theme = useTheme();
  const channel = useAtomValue(channelState);
  const user = useAtomValue(userState);
  const [ordering, setOrdering] = useAtom(orderingFamily(pageKey));
  const [search, setSearch] = useAtom(searchFamily(pageKey));
  const [createItemDialogOpen, setCreateItemDialogOpen] = useState(false);

  const userID = channel?.owner.id;
  const isOwner = user && user?.id === userID;
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isValidating, mutate } = useInfinitePagination<Params, PaginatedList<Item>>({
    apiOptions: {
      owner: userID,
      orderBy: ordering ? ordering : orderingOptions?.length ? orderingOptions[0].value : '',
      search: search || location.state?.search,
      ...apiOptions,
    } as Params & undefined,
    apiService: apiService,
    infiniteScrollRef,
    swrInfiniteOption,
  });

  // update spacerRef height
  const spacerRef = useAtomValue(spacerRefState);
  useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!ordering && orderingOptions?.length) setOrdering(orderingOptions[0].value || '');
  }, [ordering]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.state?.search) {
      setSearch(location.state.search);
      delete location.state.search;
    }
  }, [location.state?.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const MemoizedRenderItem = useMemo(() => memo(renderItem), [renderItem]);
  const isEmpty = data?.[0]?.total === 0;

  return (
    <Box sx={{ width: '100%', p: boxPadding == undefined ? 3 : boxPadding }}>
      <Box sx={{ display: 'block', maxWidth: maxWidth || 'lg', width: '100%', m: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            justifyContent: 'center',
            ...gridBoxSx,
            minHeight: '200px',
            alignItems: 'flex-start',
            alignContent: 'flex-start',
          }}
        >
          {pageHeader && <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>{pageHeader}</Box>}

          <Box
            sx={{
              gridColumn: '1 / -1',
              width: '100%',
              bgcolor: theme.palette.background.paper,
              ...(!disableSticky && { position: 'sticky', top: spacerRef?.clientHeight, zIndex: 5 }),
            }}
          >
            <PaginationActions
              orderingOptions={orderingOptions || []}
              mutate={mutate}
              {...(disableSearch ? {} : { search, setSearch })}
              {...(orderingOptions?.length ? { ordering, setOrdering } : {})}
              extraFilter={extraFilter}
            >
              {extraAction}
              <Typography variant="subtitle2" sx={{ px: 1, textAlign: 'right', minWidth: { xs: '4em', sm: '5em' } }}>
                {t('{{ count }} items', { count: data?.[0]?.total || 0 })}
              </Typography>
            </PaginationActions>
          </Box>

          {CreateItemComponent && isOwner && (
            <Box className="create-resource-button" sx={{ position: 'relative', height: '100%' }}>
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
              <CreateItemComponent open={createItemDialogOpen} setOpen={setCreateItemDialogOpen} refresh={mutate} />
            </Box>
          )}
          <MemoizedRenderItem data={data} />
        </Box>
        {data?.[0]?.total != null && !isEmpty && (
          <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
        )}
        {isEmpty && <Box sx={{ opacity: 0.7, gridColumn: '1 / -1', width: '100%', textAlign: 'center' }}>{emptyMessage}</Box>}
      </Box>
      <ScrollRestoration />
    </Box>
  );
};
