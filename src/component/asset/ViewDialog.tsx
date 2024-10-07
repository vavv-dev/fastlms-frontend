import { AssetDisplayResponse } from '@/api';
import { Dialog, DialogContent, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Tracking } from './Tracking';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: AssetDisplayResponse;
}

// safe iframe url
const URL_BASE = import.meta.env.VITE_ASSET_URL_BASE;

export const ViewDialog = ({ open, setOpen, data }: Props) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState<string>('16/9');

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

  const assetKind = data.asset_kind;

  if (!open) return null;

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
        {assetKind === 'html' && <HTMLViewer url={`${URL_BASE}/${data.id}`} aspectRatio={aspectRatio} />}
        {/* pdf, ppt, epub ...*/}
        <Tracking data={data} />
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
