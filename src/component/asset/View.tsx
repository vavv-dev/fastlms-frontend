import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import { EpubViewer } from './EpubViewer';
import { Tracking } from './Tracking';

import { AssetDisplayResponse, AssetGetDisplayData, assetGetDisplay } from '@/api';
import { useServiceImmutable } from '@/component/common';

// safe iframe url
const URL_BASE = import.meta.env.VITE_ASSET_URL_BASE;

export const View = ({ id }: { id: string }) => {
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
    // clean up
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [data]);

  if (!open || !data) return null;

  const assetKind = data?.sub_kind;

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        my: 'auto',
        width: '100%',
        maxWidth: 'lg',
        display: 'flex',
        position: 'relative',
      }}
    >
      {assetKind === 'html' && <HTMLViewer url={`${URL_BASE}/html/${data.id}`} aspectRatio={aspectRatio} />}
      {assetKind === 'pdf' && <PDFViewer url={`${URL_BASE}/pdf/${data.id}`} />}
      {assetKind === 'epub' && <EpubViewer url={data.url} />}
      {/* ppt, epub ...*/}
      <Tracking data={data} />
    </Box>
  );
};

const HTMLViewer = ({ url, aspectRatio }: { url: string; aspectRatio: string }) => {
  return <iframe src={url} style={{ width: '100%', aspectRatio: aspectRatio, border: 'none' }} allowFullScreen></iframe>;
};

const PDFViewer = ({ url }: { url: string }) => {
  return <iframe src={url} style={{ width: '100%', height: 'calc(100vh - 4em)', border: 'none' }} allowFullScreen></iframe>;
};
