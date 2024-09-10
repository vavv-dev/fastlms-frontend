import { ChevronLeft, NavigateNext } from '@mui/icons-material';
import { Box, BoxProps, IconButton, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import { atom, useAtom } from 'jotai';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
  itemWidth?: number;
  itemGap?: number;
  containerRef: React.RefObject<HTMLDivElement>;
  disableSlider?: boolean;
  sx?: BoxProps['sx'];
}

const containerWidthState = atom<number>(0);

export const GridSlider: React.FC<Props> = ({
  title,
  children,
  maxWidth,
  itemWidth = 251,
  itemGap = 16,
  containerRef,
  disableSlider,
  sx,
}) => {
  const theme = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [containerWidth, setContainerWidth] = useAtom(containerWidthState);
  const mdlUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('mdl'));

  const maxItems = useMemo(() => {
    const availableWidth = maxWidth ? Math.min(containerWidth, maxWidth) : containerWidth;
    return Math.floor((availableWidth + itemGap) / (itemWidth + itemGap));
  }, [containerWidth, maxWidth, itemWidth, itemGap]);

  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const styles = window.getComputedStyle(containerRef.current);
        const paddingLeft = parseFloat(styles.paddingLeft);
        const paddingRight = parseFloat(styles.paddingRight);
        setContainerWidth(containerRef.current.clientWidth - paddingLeft - paddingRight - (mdlUp ? 32 : 0));
      }
    };
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [maxWidth, itemWidth, itemGap, containerRef, mdlUp, setContainerWidth]);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowRightArrow(scrollWidth > clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children, maxItems]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -(itemWidth + itemGap) : itemWidth + itemGap;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!containerWidth) return null;

  return (
    <Box
      sx={{
        display: 'block',
        width: '100%',
        mx: 'auto',
        position: 'relative',
        maxWidth: maxWidth ? maxItems * (itemWidth + itemGap) - itemGap : containerWidth,
        ...sx,
      }}
    >
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          {title}
        </Typography>
      )}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          display: 'grid',
          gap: `${itemGap}px`,
          gridTemplateColumns: `repeat(${maxItems}, ${itemWidth}px)`,
          gridAutoFlow: disableSlider ? 'row' : 'column',
          gridAutoColumns: `${itemWidth}px`,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollSnapType: 'x mandatory',
          '& > *': {
            scrollSnapAlign: 'start',
          },
        }}
      >
        {children}
      </Box>
      {showLeftArrow && (
        <IconButton
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: '-20px',
            top: '50%',
            transform: 'translateY(-36px)',
            zIndex: 1,
            bgcolor: theme.palette.background.paper,
            '&:hover': { filter: 'brightness(0.9)', bgcolor: theme.palette.background.paper },
            boxShadow: theme.shadows[2],
          }}
        >
          <ChevronLeft />
        </IconButton>
      )}
      {showRightArrow && (
        <IconButton
          onClick={() => scroll('right')}
          sx={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
            transform: 'translateY(-36px)',
            zIndex: 1,
            bgcolor: theme.palette.background.paper,
            '&:hover': { filter: 'brightness(0.9)', bgcolor: theme.palette.background.paper },
            boxShadow: theme.shadows[2],
          }}
        >
          <NavigateNext />
        </IconButton>
      )}
    </Box>
  );
};
