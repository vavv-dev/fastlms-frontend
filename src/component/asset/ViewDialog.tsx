import { Dialog, DialogContent, useMediaQuery, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { EpubViewer } from './EpubViewer';
import { Tracking } from './Tracking';

import { AssetDisplayResponse, AssetGetDisplayData, assetGetDisplay } from '@/api';
import { chatDrawerState } from '@/component/chat';
import { useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: AssetDisplayResponse;
  id?: string;
}

/**
 * TODO conditionaly tracking if not asset error
 */

// safe iframe url
const URL_BASE = import.meta.env.VITE_ASSET_URL_BASE;

export const ViewDialog = ({ open, setOpen, data, id }: Props) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState<string>('16/9');
  const { data: _data } = useServiceImmutable<AssetGetDisplayData, AssetDisplayResponse>(assetGetDisplay, {
    id: data ? '' : (id as string),
  });
  const chatDrawerOpen = useAtomValue(chatDrawerState);
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  const asset = data || _data;

  useEffect(() => {
    if (asset?.asset_kind !== 'html') return;

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
  }, [asset]);

  if (!open || !asset) return null;

  const assetKind = asset?.asset_kind;

  return (
    <Dialog
      disableEnforceFocus={chatDrawerOpen}
      PaperProps={{ sx: { borderRadius: theme.shape.borderRadius, overflow: 'hidden' } }}
      fullWidth
      open={open}
      onClose={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}
      maxWidth="lg"
      sx={{
        ...(smDown && {
          '& .MuiDialog-paper': {
            margin: '8px',
            width: 'calc(100% - 16px)',
            height: asset.asset_kind == 'html' ? 'calc(100% - 16px)' : 'auto',
          },
        }),
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', position: 'relative' }}>
        {assetKind === 'html' && <HTMLViewer url={`${URL_BASE}/html/${asset.id}`} aspectRatio={aspectRatio} />}
        {assetKind === 'pdf' && <PDFViewer url={`${URL_BASE}/pdf/${asset.id}`} />}
        {assetKind === 'epub' && <EpubViewer url={asset.url} />}
        {/* ppt, epub ...*/}
        <Tracking data={asset} />
      </DialogContent>
    </Dialog>
  );
};

const HTMLViewer = ({ url, aspectRatio }: { url: string; aspectRatio: string }) => {
  return <iframe src={url} style={{ width: '100%', aspectRatio: aspectRatio, border: 'none' }} allowFullScreen></iframe>;
};

const PDFViewer = ({ url }: { url: string }) => {
  return <iframe src={url} style={{ width: '100%', height: 'calc(100vh - 4em)', border: 'none' }} allowFullScreen></iframe>;
};
