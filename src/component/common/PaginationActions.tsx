import { RefreshOutlined, SortOutlined } from '@mui/icons-material';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { CircularProgress, FormControl, IconButton, InputAdornment, MenuItem, Select, TextField } from '@mui/material';
import { Box } from '@mui/system';
import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// import GradientCircularProgress from './GradientCircularProgress';

interface ActionProps {
  ordering?: string;
  setOrdering?: (v: string) => void;
  orderingOptions?: { label: string; value: string | undefined }[];
  search?: string;
  setSearch?: (s: string) => void;
  mutate?: () => void;
  children?: React.ReactNode;
}

const PaginationActions = ({ ordering, setOrdering, orderingOptions, search, setSearch, mutate, children }: ActionProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {setOrdering && <OrderingOptions ordering={ordering} setOrdering={setOrdering} orderingOptions={orderingOptions} />}
        {setSearch && <SimpleSearch search={search} setSearch={setSearch} />}
      </Box>
      <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'end', gap: 2 }}>
        {children}
        <IconButton color="primary" onClick={() => mutate && mutate()}>
          <RefreshOutlined />
        </IconButton>
      </Box>
    </Box>
  );
};

export { PaginationActions };

const OrderingOptions = ({ ordering, setOrdering, orderingOptions }: ActionProps) => {
  return (
    <FormControl variant="standard" size="small">
      <Select
        disableUnderline
        id="pagination-ordering"
        value={ordering}
        onChange={(e) => setOrdering && setOrdering(e.target.value)}
        IconComponent={() => <SortOutlined sx={{ mr: 1 }} />}
        dir="rtl"
        sx={{ '.MuiSelect-select:focus': { bgcolor: 'background.default' }, fontSize: '0.9em' }}
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

const SimpleSearch = ({ search, setSearch }: ActionProps) => {
  const { t } = useTranslation('common');
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <TextField
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlinedIcon />
          </InputAdornment>
        ),
        endAdornment: search && (
          <InputAdornment
            position="end"
            onClick={() => {
              setSearchInput('');
              setSearch?.('');
            }}
            sx={{ cursor: 'pointer' }}
          >
            <ClearOutlinedIcon />
          </InputAdornment>
        ),
      }}
      size="small"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && setSearch && setSearch(searchInput || '')}
      variant="standard"
      placeholder={t('Search')}
      sx={{
        minWidth: '4em',
        '& .MuiInput-underline:before': { borderBottom: 'none' },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
      }}
    />
  );
};

const InfiniteScrollIndicator = forwardRef((props: { show: boolean; small?: boolean }, ref: React.Ref<HTMLDivElement>) => {
  // From https://github.com/mui/material-ui/issues/9496#issuecomment-959408221
  // TODO
  return (
    <>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <Box
        ref={ref}
        sx={{
          width: '100%',
          minHeight: props.small ? `${1.8 + 2}em` : `${2.5 + 2}em`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {props.show && (
          <CircularProgress
            disableShrink
            sx={{ 'svg circle': { stroke: 'url(#my_gradient)' } }}
            size={props.small ? '1.8em' : '2.5em'}
          />
        )}
      </Box>
    </>
  );
});

export { InfiniteScrollIndicator };
