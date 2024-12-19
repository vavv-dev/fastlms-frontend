import { Box, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { EpubViewer } from './EpubViewer';
import { Tracking } from './Tracking';

import { AssetDisplayResponse, AssetGetDisplayData, assetGetDisplay } from '@/api';
import { useServiceImmutable } from '@/component/common';

// safe iframe url
const URL_BASE = import.meta.env.VITE_ASSET_URL_BASE;

export const View = ({ id }: { id: string }) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState<string>('16/9');
  const { data } = useServiceImmutable<AssetGetDisplayData, AssetDisplayResponse>(assetGetDisplay, { id });

  useEffect(() => {
    if (data?.sub_kind !== 'html') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'aspectRatio') {
        const ratio = event.data.value;
        setAspectRatio(ratio);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [data]);

  if (!data) return null;

  const assetKind = data?.sub_kind;

  return (
    <Box
      sx={{
        flexGrow: assetKind === 'epub' ? 0 : 1,
        width: '100%',
        display: 'flex',
        overflow: 'auto',
        // mobile
        [theme.breakpoints.down('mobile')]: {
          height: data.sub_kind === 'html' ? '100%' : 'auto',
        },
        // mobile landscape
        [`${theme.breakpoints.down('md')} and (orientation: landscape)`]: {
          height: data.sub_kind === 'html' ? '100%' : 'auto',
        },
      }}
    >
      {assetKind === 'html' && <HTMLViewer url={`${URL_BASE}/html/${data.id}`} aspectRatio={aspectRatio} />}
      {assetKind === 'pdf' && <PDFViewer url={`${URL_BASE}/pdf/${data.id}`} />}
      {assetKind === 'epub' && <EpubViewer url={data.url} />}
      <Tracking data={data} sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', zIndex: 3 }} />
    </Box>
  );
};

interface HTMLViewerProps {
  url: string;
  aspectRatio: string;
}

const HTMLViewer = ({ url, aspectRatio }: HTMLViewerProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current?.contentWindow?.location.replace(url);
  }, [url]);
  return (
    <iframe
      ref={ref}
      srcDoc="<!DOCTYPE html><html></html>"
      style={{ width: '100%', aspectRatio: aspectRatio, border: 'none' }}
      allowFullScreen
    />
  );
};

interface PDFViewerProps {
  url: string;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current?.contentWindow?.location.replace(url);
  }, [url]);
  return (
    <iframe
      ref={ref}
      srcDoc="<!DOCTYPE html><html></html>"
      style={{ width: '100%', height: '100%', border: 'none' }}
      allowFullScreen
    />
  );
};
