import { RefreshOutlined, SortOutlined } from '@mui/icons-material';
import { FormControl, IconButton, MenuItem, Select } from '@mui/material';
import { Box } from '@mui/system';
import { forwardRef, memo, useEffect, useState } from 'react';

import { GradientCircularProgress, SimpleSearch } from '.';

interface ActionProps {
  ordering?: string;
  setOrdering?: (v: string) => void;
  orderingOptions?: { label: string; value: string | undefined }[];
  search?: string;
  setSearch?: (s: string) => void;
  mutate?: () => void;
  children?: React.ReactNode;
  extraFilter?: React.ReactNode;
}

const PaginationActions = ({
  ordering,
  setOrdering,
  orderingOptions,
  search,
  setSearch,
  mutate,
  children,
  extraFilter,
}: ActionProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, whiteSpace: 'nowrap' }}>
      {setOrdering && <OrderingOptions ordering={ordering} setOrdering={setOrdering} orderingOptions={orderingOptions} />}
      {setSearch && <SimpleSearch search={search} setSearch={setSearch} />}
      {extraFilter || <Box sx={{ flexGrow: 1 }} />}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: { xs: 0.5, sm: 2 } }}>
        {children}
        <IconButton color="primary" onClick={() => mutate?.()}>
          <RefreshOutlined />
        </IconButton>
      </Box>
    </Box>
  );
};

export { PaginationActions };

const OrderingOptions = ({ ordering, setOrdering, orderingOptions }: ActionProps) => {
  return (
    <FormControl variant="standard" size="small" sx={{ flexShrink: 0 }}>
      <Select
        disableUnderline
        id="pagination-ordering"
        value={ordering}
        onChange={(e) => setOrdering && setOrdering(e.target.value)}
        IconComponent={() => <SortOutlined sx={{ mr: 1 }} />}
        dir="rtl"
        sx={{ minWidth: '8em', '.MuiSelect-select:focus': { bgcolor: 'background.default' }, fontSize: '0.9em' }}
      >
        {orderingOptions?.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const InfiniteScrollIndicator = memo(
  forwardRef((props: { show: boolean; small?: boolean }, ref: React.Ref<HTMLDivElement>) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
      setTimeout(() => setShow(props.show), props.show ? 0 : 200);
    }, [props.show]);

    return (
      <Box
        ref={ref}
        sx={{ width: '100%', height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
      >
        {show && (
          <GradientCircularProgress
            sx={{ position: 'absolute', zIndex: 5, bottom: '1em' }}
            size={props.small ? '1.8em' : '2.5em'}
          />
        )}
      </Box>
    );
  }),
);

export { InfiniteScrollIndicator };
