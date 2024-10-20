import { AssetDisplayResponse, AssetGetDisplayData, assetGetDisplay } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { Dialog, DialogContent, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Tracking } from './Tracking';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: AssetDisplayResponse;
  id?: string;
}

// safe iframe url
const URL_BASE = import.meta.env.VITE_ASSET_URL_BASE;

export const ViewDialog = ({ open, setOpen, data, id }: Props) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState<string>('16/9');
  const { data: _data } = useServiceImmutable<AssetGetDisplayData, AssetDisplayResponse>(assetGetDisplay, {
    id: data ? '' : (id as string),
  });
  const asset = data || _data;

  useEffect(() => {
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
  }, []);

  if (!open || !asset) return null;

  const assetKind = asset?.asset_kind;

  return (
    <Dialog
      PaperProps={{ sx: { borderRadius: theme.shape.borderRadius, overflow: 'hidden' } }}
      fullWidth
      open={open}
      onClose={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}
      maxWidth="lg"
    >
      <DialogContent sx={{ p: 0, display: 'flex', position: 'relative' }}>
        {assetKind === 'html' && <HTMLViewer url={`${URL_BASE}/${asset.id}`} aspectRatio={aspectRatio} />}
        {/* pdf, ppt, epub ...*/}
        <Tracking data={asset} />
      </DialogContent>
    </Dialog>
  );
};

interface HTMLViewerProps {
  url: string;
  aspectRatio: string;
}

const HTMLViewer = ({ url, aspectRatio }: HTMLViewerProps) => {
  return <iframe src={url} style={{ width: '100%', aspectRatio: aspectRatio, border: 'none' }} allowFullScreen></iframe>;
};
