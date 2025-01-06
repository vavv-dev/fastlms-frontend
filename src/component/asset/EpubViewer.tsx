import { TextFieldsOutlined } from '@mui/icons-material';
import { Box, ToggleButton, Typography, useTheme } from '@mui/material';
import type { NavItem, Rendition } from 'epubjs';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type IReactReaderStyle } from 'react-reader';

import { pageFamily } from '.';

import { GradientCircularProgress } from '@/component/common';
import { modeState } from '@/theme';

type RenditionEvent = 'display' | 'serialize' | 'content' | 'unloaded' | 'layout' | 'render' | 'show';

const ReactReader = lazy(() => import('react-reader').then((module) => ({ default: module.ReactReader })));
const MemoizedReactReader = memo(ReactReader);
const chapterFamily = atomFamily(() => atom<string>(''));
const largeTextState = atom(false);

export const EpubViewer = ({ url }: { url: string }) => {
  const { t } = useTranslation('asset');
  const theme = useTheme();
  const [location, setLocation] = useAtom(pageFamily(url));
  const [page, setPage] = useAtom(chapterFamily(url));
  const [largeText, setLargeText] = useAtom(largeTextState);
  const toc = useRef<NavItem[]>([]);
  const mounted = useRef(true);
  const mode = useAtomValue(modeState);

  const [height, setHeight] = useState(0);
  const rendition = useRef<Rendition | undefined>(undefined);
  const resizeHandler = useRef<() => void | undefined>(undefined);

  const cleanupRendition = () => {
    if (rendition.current) {
      try {
        const events: RenditionEvent[] = ['display', 'serialize', 'content', 'unloaded', 'layout', 'render', 'show'];
        events.forEach((event) => {
          if (rendition.current?.hooks?.[event]?.list) {
            const listeners = rendition.current.hooks[event].list();
            listeners.forEach((listener) => {
              rendition.current?.off(event, listener);
            });
          }
        });

        if (rendition.current.destroy && typeof rendition.current.destroy === 'function') {
          rendition.current.destroy();
        }
      } catch (e) {
        console.warn('Error cleaning up rendition:', e);
      } finally {
        rendition.current = undefined;
      }
    }
  };

  useEffect(() => {
    mounted.current = true;

    const updateHeight = () => {
      if (!mounted.current) return;

      const width = window.innerWidth;
      if (width < 768) {
        setHeight(width * 1.5);
      } else if (width < 1024) {
        setHeight(width * 0.75);
      } else {
        setHeight(Math.min(720, width * 0.5625));
      }
    };

    resizeHandler.current = updateHeight;
    window.addEventListener('resize', updateHeight);
    updateHeight();

    return () => {
      mounted.current = false;
      if (resizeHandler.current) {
        window.removeEventListener('resize', resizeHandler.current);
      }
      cleanupRendition();
    };
  }, []);

  useEffect(() => {
    if (rendition.current && mounted.current) {
      rendition.current.themes.fontSize(largeText ? '140%' : '100%');
    }
  }, [largeText]);

  const handleRendition = (newRendition: Rendition) => {
    if (!mounted.current) return;

    cleanupRendition();
    rendition.current = newRendition;
    rendition.current.themes.fontSize(largeText ? '140%' : '100%');

    rendition.current.themes.override('color', theme.palette.text.primary);
    rendition.current.themes.override('background', theme.palette.background.default);
  };

  const handleLocationChanged = useCallback(
    (loc: string) => {
      if (!mounted.current) return;

      requestAnimationFrame(() => {
        setLocation(loc);
      });

      if (rendition.current && toc.current) {
        const { href } = rendition.current.location.start;
        const cleanHref = href.split('#')[0];
        const chapter = toc.current.find((item) => {
          const itemHref = item.href.split('#')[0];
          return cleanHref === itemHref;
        });
        setPage(chapter ? chapter.label : t(''));
      }
    },
    [setPage, t, setLocation],
  );

  return (
    <Box sx={{ width: '100%', height: height, position: 'relative' }}>
      <Typography
        variant="caption"
        sx={{ position: 'absolute', top: '1em', zIndex: 2, left: '50%', transform: 'translateX(-50%)' }}
      >
        {page}
      </Typography>

      <ToggleButton
        sx={{ position: 'absolute', top: '1em', right: '1em', zIndex: 2, borderRadius: '50%', padding: '0.5em', border: 'none' }}
        value="check"
        selected={largeText}
        onChange={() => setLargeText((prev) => !prev)}
        size="small"
      >
        <TextFieldsOutlined fontSize="small" />
      </ToggleButton>

      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <GradientCircularProgress />
          </Box>
        }
      >
        <MemoizedReactReader
          url={url}
          location={location}
          epubOptions={{ allowScriptedContent: true }}
          loadingView={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <GradientCircularProgress />
            </Box>
          }
          tocChanged={(_toc) => mounted.current && (toc.current = _toc)}
          locationChanged={handleLocationChanged}
          readerStyles={mode === 'dark' ? darkReaderTheme : lightReaderTheme}
          getRendition={handleRendition}
        />
      </Suspense>
    </Box>
  );
};

const ReactReaderStyle: IReactReaderStyle = {
  container: {
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
  },
  readerArea: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
    transition: 'all .3s ease',
  },
  containerExpanded: {
    transform: 'translateX(256px)',
  },
  titleArea: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: '#999',
  },
  reader: {
    position: 'absolute',
    top: 50,
    left: 50,
    bottom: 20,
    right: 50,
  },
  swipeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 200,
  },
  prev: {
    left: 1,
  },
  next: {
    right: 1,
  },
  arrow: {
    outline: 'none',
    border: 'none',
    background: 'none',
    position: 'absolute',
    top: '50%',
    marginTop: -32,
    fontSize: 64,
    padding: '0 10px',
    color: '#E2E2E2',
    fontFamily: 'arial, sans-serif',
    cursor: 'pointer',
    userSelect: 'none',
    appearance: 'none',
    fontWeight: 'normal',
  },
  arrowHover: {
    color: '#777',
  },
  toc: {},
  tocBackground: {
    position: 'absolute',
    left: 256,
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 1,
  },
  tocArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
    width: 256,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    background: '#f2f2f2',
    padding: '10px 0',
  },
  tocAreaButton: {
    userSelect: 'none',
    appearance: 'none',
    background: 'none',
    border: 'none',
    display: 'block',
    fontFamily: 'sans-serif',
    width: '100%',
    fontSize: '.9em',
    textAlign: 'left',
    padding: '.9em 1em',
    borderBottom: '1px solid #ddd',
    color: '#aaa',
    boxSizing: 'border-box',
    outline: 'none',
    cursor: 'pointer',
  },
  tocButton: {
    background: 'none',
    border: 'none',
    width: 32,
    height: 32,
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
  tocButtonExpanded: {
    background: '#f2f2f2',
  },
  tocButtonBar: {
    position: 'absolute',
    width: '60%',
    background: '#ccc',
    height: 2,
    left: '50%',
    margin: '-1px -30%',
    top: '50%',
    transition: 'all .5s ease',
  },
  tocButtonBarTop: {
    top: '35%',
  },
  tocButtonBottom: {
    top: '66%',
  },
  loadingView: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    color: '#ccc',
    textAlign: 'center',
    marginTop: '-.5em',
  },
};

const lightReaderTheme: IReactReaderStyle = {
  ...ReactReaderStyle,
  readerArea: {
    ...ReactReaderStyle.readerArea,
    transition: undefined,
  },
};

const darkReaderTheme: IReactReaderStyle = {
  ...ReactReaderStyle,
  arrow: {
    ...ReactReaderStyle.arrow,
    color: 'white',
  },
  arrowHover: {
    ...ReactReaderStyle.arrowHover,
    color: '#ccc',
  },
  readerArea: {
    ...ReactReaderStyle.readerArea,
    backgroundColor: '#000',
    transition: undefined,
  },
  titleArea: {
    ...ReactReaderStyle.titleArea,
    color: '#ccc',
  },
  tocArea: {
    ...ReactReaderStyle.tocArea,
    background: '#111',
  },
  tocButtonExpanded: {
    ...ReactReaderStyle.tocButtonExpanded,
    background: '#222',
  },
  tocButtonBar: {
    ...ReactReaderStyle.tocButtonBar,
    background: '#fff',
  },
  tocButton: {
    ...ReactReaderStyle.tocButton,
    color: 'white',
  },
};
