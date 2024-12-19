import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Box, IconButton, ToggleButton, ToggleButtonGroup, alpha, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TagGroupProps {
  tags: string[][];
  tag: string | null;
  setTag: (tag: string) => void;
  extraButtions?: React.ReactNode;
}

export const TagGroup = ({ tags, tag, setTag, extraButtions }: TagGroupProps) => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const checkForOverflow = useCallback(() => {
    const element = scrollRef.current;
    if (element) {
      const hasOverflow = element.scrollWidth > element.clientWidth;
      const scrollLeft = element.scrollLeft;
      const maxScroll = element.scrollWidth - element.clientWidth;
      setShowLeftButton(scrollLeft > 1);
      setShowRightButton(hasOverflow && Math.ceil(scrollLeft) < maxScroll - 1);
    }
  }, []);

  const arrowButton = {
    zIndex: 2,
    top: '50%',
    position: 'absolute',
    transform: 'translateY(-50%)',
    backdropFilter: 'blur(8px)',
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    // bgcolor: alpha(theme.palette.background.paper, 0.4),
    // boxShadow: `0 4px 30px ${alpha(theme.palette.common.black, 0.1)}`,
    // border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
  };

  useEffect(() => {
    checkForOverflow();
    window.addEventListener('resize', checkForOverflow);
    return () => window.removeEventListener('resize', checkForOverflow);
  }, [checkForOverflow]);

  const scroll = (direction: 'left' | 'right') => {
    const element = scrollRef.current;
    if (element) {
      const scrollAmount = direction === 'left' ? -element.clientWidth : element.clientWidth;
      element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      const checkScrollEnd = () => {
        checkForOverflow();
        if (element.scrollLeft % 1 !== 0) {
          requestAnimationFrame(checkScrollEnd);
        }
      };
      requestAnimationFrame(checkScrollEnd);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '-webkit-fill-available', flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
      {showLeftButton && (
        <IconButton size="small" onClick={() => scroll('left')} sx={{ left: '-16px', ...arrowButton }}>
          <ChevronLeft />
        </IconButton>
      )}
      {showRightButton && (
        <IconButton size="small" onClick={() => scroll('right')} sx={{ right: '-16px', ...arrowButton }}>
          <ChevronRight />
        </IconButton>
      )}
      <Box
        ref={scrollRef}
        sx={{ overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
        onScroll={checkForOverflow}
      >
        <ToggleButtonGroup
          value={tag}
          exclusive
          onChange={(_, v) => setTag(v ? v : '')}
          sx={{
            display: 'inline-flex',
            '& .MuiButtonBase-root': {
              whiteSpace: 'nowrap',
              px: 1.5,
              py: 0.3,
              my: 0.5,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.1) },
              fontWeight: 'bold',
              '&.Mui-selected': {
                color: 'background.paper',
                bgcolor: theme.palette.text.primary,
                '&:hover': { bgcolor: theme.palette.text.primary },
              },
              '&.MuiButtonBase-root': { borderRadius: '8px', border: 'none' },
              '&.MuiButtonBase-root+.MuiButtonBase-root': { ml: 0.8 },
            },
          }}
        >
          {tags
            .filter(([name]) => name.toLowerCase() !== 'yt:cc=on')
            .map(([name, label]) => (
              <ToggleButton key={name} value={name} sx={{ textTransform: 'none' }}>
                {label}
              </ToggleButton>
            ))}
          {extraButtions}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};
