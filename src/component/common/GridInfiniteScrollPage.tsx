import { CancelablePromise } from '@/api';
import { InfiniteScrollIndicator, PaginationActions, useInfinitePagination } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { Add } from '@mui/icons-material';
import { Box, BoxProps, Button, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { spacerRefState } from '../layout';

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
  renderItem: (props: { data: PaginatedList<Item>[] | undefined }) => React.ReactNode;
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
}

export const GridInfiniteScrollPage = <Item, Params extends { orderBy?: string }>({
  pageKey,
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
  extraFilter,
  disableSticky,
}: GridInfiniteScrollPageProps<Item, Params>) => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const theme = useTheme();
  const homeUser = useAtomValue(homeUserState);
  const user = useAtomValue(userState);
  const [ordering, setOrdering] = useAtom(orderingFamily(pageKey));
  const [search, setSearch] = useAtom(searchFamily(pageKey));
  const [createItemDialogOpen, setCreateItemDialogOpen] = useState(false);

  const userID = homeUser?.id;
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
      location.state.search = undefined;
    }
  }, [location.state?.search]); // eslint-disable-line react-hooks/exhaustive-deps

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
              <Typography variant="subtitle2" sx={{ px: 1, textAlign: 'right', minWidth: '5em' }}>
                {t('{{ count }} items', { count: data?.[0]?.total || 0 })}
              </Typography>
            </PaginationActions>
          </Box>

          {CreateItemComponent && isOwner && (
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
              <CreateItemComponent open={createItemDialogOpen} setOpen={setCreateItemDialogOpen} refresh={mutate} />
            </Box>
          )}

          {renderItem({ data })}
        </Box>

        <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
      </Box>
    </Box>
  );
};
