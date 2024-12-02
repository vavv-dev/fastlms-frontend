import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard, useUppyEvent } from '@uppy/react';
import '@uppy/status-bar/dist/style.min.css';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { uppyFamily } from './uppy';

import { BaseDialog } from '@/component/common';
import { modeState } from '@/theme';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export const UploadDialog = ({ open, setOpen, id, onProgress, onComplete }: Props) => {
  const { t } = useTranslation('uppy');
  const themeMode = useAtomValue(modeState);

  const createUppy = useAtomValue(uppyFamily(id));
  const uppy = useMemo(() => createUppy(t), [createUppy, t]);

  const closeDialog = () => {
    setOpen(false);
  };

  useUppyEvent(uppy, 'progress', (progress) => {
    onProgress?.(progress);
  });

  useUppyEvent(uppy, 'complete', () => {
    onComplete?.();
  });

  if (!uppy) return null;

  return (
    <BaseDialog
      isReady
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      renderContent={() => <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} height={400} theme={themeMode} />}
      sx={{ '& .MuiDialogContent-root': { display: 'block' } }}
    />
  );
};
