import { Button, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { BaseDialog } from './BaseDialog';
import { updateInfiniteCache } from './swr';

import { snackbarMessageState } from '@/component/layout';

interface Props {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  resourceId: string;
  destroyService: (params: { id: any }) => Promise<any>; // eslint-disable-line
  listService: () => Promise<any>; // eslint-disable-line
}

export const DeleteResourceDialog = ({ title, open, setOpen, resourceId, destroyService, listService }: Props) => {
  const { t } = useTranslation('common');
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const cancelRef = useRef(false);

  const deleteResource = useCallback(() => {
    setSnackbarMessage({
      message: t('Deleting...'),
      duration: 3000,
      action: (
        <Button
          onClick={() => {
            cancelRef.current = true;
            setSnackbarMessage(null);
          }}
          sx={{ color: 'primary.light' }}
        >
          {t('Cancel')}
        </Button>
      ),
    });

    setTimeout(async () => {
      if (!cancelRef.current) {
        await destroyService({ id: resourceId }).catch((error) => console.error(error));
        // update cache
        updateInfiniteCache(listService, { id: resourceId }, 'delete');
      }
      setSnackbarMessage(null);
    }, 3000);

    setOpen(false);
  }, [destroyService, resourceId, setSnackbarMessage, setOpen, t, listService]);

  return (
    <BaseDialog
      isReady
      open={open}
      setOpen={setOpen}
      renderContent={() => (
        <>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            {t('Are you sure you want to delete? This action will delete all related data.')}
            <br />
            {t('This action cannot be undone.')}
          </Typography>
          <Typography variant="subtitle1">{title}</Typography>
        </>
      )}
      actions={
        <Button onClick={() => deleteResource()} autoFocus>
          {t('Delete')}
        </Button>
      }
    />
  );
};
