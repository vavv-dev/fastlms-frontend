import { Dialog, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

// safe iframe url
const URL_BASE = import.meta.env.VITE_CONTENT_URL_BASE;

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState<string>('16/9');
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  if (!open) return null;

  // TODO

  return (
    <Dialog
      PaperProps={{ sx: { borderRadius: theme.shape.borderRadius } }}
      fullWidth
      open={open}
      onClose={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}
      maxWidth="lg"
    >
      <iframe
        ref={iframeRef}
        src={`${URL_BASE}/${id}`}
        style={{ width: '100%', aspectRatio: aspectRatio, border: 'none' }}
        allowFullScreen
      ></iframe>
    </Dialog>
  );
};
