import { ChevronLeft, ChevronRight, RefreshOutlined, SortOutlined } from '@mui/icons-material';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { CircularProgress, FormControl, IconButton, InputAdornment, MenuItem, Select, TextField, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
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
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [rightButtonPosition, setRightButtonPosition] = useState(0);

  const checkForOverflow = useCallback(() => {
    const element = scrollRef.current;
    if (element) {
      setShowLeftButton(element.scrollLeft > 0);
      setShowRightButton(element.scrollWidth > element.clientWidth + element.scrollLeft);
    }
  }, []);

  const updateButtonPositions = useCallback(() => {
    const scrollElement = scrollRef.current;
    const containerElement = containerRef.current;
    if (scrollElement && containerElement) {
      const scrollRect = scrollElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      setRightButtonPosition(scrollRect.right - containerRect.left);
    }
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      checkForOverflow();
      updateButtonPositions();
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [checkForOverflow, updateButtonPositions]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(() => {
        checkForOverflow();
        updateButtonPositions();
      }, 100);
    }
  };

  return (
    <Box ref={containerRef} sx={{ display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap', position: 'relative' }}>
      {showLeftButton && (
        <IconButton
          size="small"
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: 0,
            transform: 'translateX(-50%)',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            '&:hover': { filter: 'brightness(0.9)', bgcolor: theme.palette.background.paper },
            boxShadow: theme.shadows[2],
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}
      {showRightButton && (
        <IconButton
          size="small"
          onClick={() => scroll('right')}
          sx={{
            position: 'absolute',
            left: `${rightButtonPosition}px`,
            transform: 'translateX(-50%)',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            '&:hover': { filter: 'brightness(0.9)', bgcolor: theme.palette.background.paper },
            boxShadow: theme.shadows[2],
          }}
        >
          <ChevronRight />
        </IconButton>
      )}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          py: '5px', // badge space
        }}
        onScroll={() => {
          checkForOverflow();
          updateButtonPositions();
        }}
      >
        {setOrdering && <OrderingOptions ordering={ordering} setOrdering={setOrdering} orderingOptions={orderingOptions} />}
        {setSearch && <SimpleSearch search={search} setSearch={setSearch} />}
        {extraFilter}
      </Box>
      <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'end', gap: 2 }}>
        {children}
        <IconButton
          color="primary"
          onClick={() => {
            if (mutate) {
              mutate();
              setTimeout(() => {
                checkForOverflow();
                updateButtonPositions();
              }, 100);
            }
          }}
        >
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

const SimpleSearch = ({ search, setSearch }: ActionProps) => {
  const { t } = useTranslation('common');
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <TextField
      inputRef={(input) => input && search && input.focus()}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment
              position="end"
              onClick={() => {
                setSearchInput('');
                setSearch?.('');
              }}
              sx={{ cursor: 'pointer', visibility: search ? 'visible' : 'hidden' }}
            >
              <ClearOutlinedIcon />
            </InputAdornment>
          ),
        },
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
        sx={{ width: '100%', height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
      >
        {props.show && (
          <CircularProgress
            disableShrink
            sx={{ 'svg circle': { stroke: 'url(#my_gradient)' }, position: 'absolute', zIndex: 5, bottom: 1 }}
            size={props.small ? '1.8em' : '2.5em'}
          />
        )}
      </Box>
    </>
  );
});

export { InfiniteScrollIndicator };
