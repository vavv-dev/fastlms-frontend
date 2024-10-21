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
      setShowLeftButton(element.scrollLeft > 0);
      setShowRightButton(hasOverflow && element.scrollLeft < element.scrollWidth - element.clientWidth);
    }
  }, []);

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
      setTimeout(checkForOverflow, 300);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {showLeftButton && (
        <IconButton
          size="small"
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            '&:hover': { bgcolor: theme.palette.background.paper },
            boxShadow: theme.shadows[2],
            ml: '1px',
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
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            '&:hover': { bgcolor: theme.palette.background.paper },
            boxShadow: theme.shadows[2],
            mr: '1px',
          }}
        >
          <ChevronRight />
        </IconButton>
      )}
      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          mx: showLeftButton || showRightButton ? 2 : 0,
        }}
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
          {tags.map(([name, label]) => (
            <ToggleButton key={name} value={name}>
              {label}
            </ToggleButton>
          ))}
          {extraButtions}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};
