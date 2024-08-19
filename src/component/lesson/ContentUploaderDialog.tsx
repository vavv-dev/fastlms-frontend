import { BaseDialog } from '@/component/common';
import { modeState } from '@/theme';
import { Box } from '@mui/material';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Dashboard } from '@uppy/react';
import '@uppy/status-bar/dist/style.min.css';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { uppyFamily } from '.';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
}

const ContentUploaderDialog = ({ open, setOpen, contentId }: Props) => {
  const { t } = useTranslation('lesson');
  const themeMode = useAtomValue(modeState);
  const uppy = useAtomValue(uppyFamily(contentId));

  const closeDialog = () => {
    setOpen(false);
  };

  if (!uppy) return null;

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{t('Upload Content')}</Box>}
      fullWidth
      maxWidth="sm"
      renderContent={() => <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} height={400} theme={themeMode} />}
    />
  );
};

export default ContentUploaderDialog;
