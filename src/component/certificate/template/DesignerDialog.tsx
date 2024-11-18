import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { BaseDialog, GradientCircularProgress } from '@/component/common';
import { userState } from '@/store';

const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <GradientCircularProgress />
  </Box>
);

const Designer = lazy(() =>
  import('./Designer').then((module) => ({
    default: module.Designer,
  })),
);

interface Props {
  id?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const DesignerDialog = ({ id, open, setOpen }: Props) => {
  const { t } = useTranslation('certificate');
  const user = useAtomValue(userState);

  const closeDialog = () => {
    setOpen(false);
  };

  if (!user || !open) return null;

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      title={id ? t('Edit certificate template') : t('Create certificate template')}
      fullWidth
      maxWidth="lg"
      renderContent={() => (
        <Suspense fallback={<LoadingComponent />}>
          <Designer id={id} />
        </Suspense>
      )}
      sx={{
        '& .MuiDialog-container > .MuiPaper-root': {
          height: '-webkit-fill-available',
          '& .MuiDialogContent-root': { pb: 0 },
        },
      }}
    />
  );
};
