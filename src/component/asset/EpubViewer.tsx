import { TextFieldsOutlined } from '@mui/icons-material';
import { Box, ToggleButton, Typography } from '@mui/material';
import type { NavItem, Rendition } from 'epubjs';
import { atom, useAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { pageFamily } from '.';

import { GradientCircularProgress } from '@/component/common';

const ReactReader = lazy(() => import('react-reader').then((module) => ({ default: module.ReactReader })));
const chapterFamily = atomFamily(() => atom<string>(''));
const largeTextState = atom(false);

export const EpubViewer = ({ url }: { url: string }) => {
  const { t } = useTranslation('asset');
  const [location, setLocation] = useAtom(pageFamily(url));
  const [page, setPage] = useAtom(chapterFamily(url));
  const [largeText, setLargeText] = useAtom(largeTextState);
  const toc = useRef<NavItem[]>([]);

  const [height, setHeight] = useState(0);
  const rendition = useRef<Rendition | undefined>(undefined);

  useEffect(() => {
    const updateHeight = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setHeight(width * 1.5);
      } else if (width < 1024) {
        setHeight(width * 0.75);
      } else {
        setHeight(Math.min(720, width * 0.5625));
      }
    };
    window.addEventListener('resize', updateHeight);
    updateHeight();
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    rendition.current?.themes.fontSize(largeText ? '140%' : '100%');
  }, [largeText]);

  return (
    <Box sx={{ width: '100%', height: height, overflow: 'hidden', position: 'relative' }}>
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: '1em',
          zIndex: 2,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
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

      <Suspense>
        <ReactReader
          url={url}
          location={location}
          epubOptions={{ allowScriptedContent: true }}
          loadingView={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <GradientCircularProgress />
            </Box>
          }
          tocChanged={(_toc) => (toc.current = _toc)}
          locationChanged={(loc: string) => {
            setLocation(loc);
            if (rendition.current && toc.current) {
              const { href } = rendition.current.location.start;
              const cleanHref = href.split('#')[0];
              const chapter = toc.current.find((item) => {
                const itemHref = item.href.split('#')[0];
                return cleanHref === itemHref;
              });
              setPage(chapter ? chapter.label : t(''));
            }
          }}
          getRendition={(_rendition: Rendition) => {
            rendition.current = _rendition;
            rendition.current.themes.fontSize(largeText ? '140%' : '100%');
          }}
        />
      </Suspense>
    </Box>
  );
};
