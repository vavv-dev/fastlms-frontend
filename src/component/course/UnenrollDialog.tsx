import { courseGetDisplays, courseUnenroll } from '@/api';
import { BaseDialog } from '@/component/common';
import { updateInfiniteCache } from '@/component/common/swr';
import { snackbarMessageState } from '@/component/layout';
import { Button, DialogContentText } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  title: string;
}

export const UnenrollDialog = ({ open, setOpen, id, title }: Props) => {
  const { t } = useTranslation('course');
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  const deleteResource = useCallback(() => {
    courseUnenroll({ id })
      .then(() => {
        updateInfiniteCache(courseGetDisplays, { id, enrolled: false }, 'update');
        setTimeout(() => {
          setSnackbarMessage({ message: t('You are now unenrolled from this course.'), duration: 3000 });
        }, 500);
      })
      .catch((error) => console.error(error))
      .finally(() => setOpen(false));
  }, [id, setOpen, setSnackbarMessage, t]);

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title={t('Unenroll from {{ title }}', { title })}
      renderContent={() => (
        <DialogContentText>
          {t('Are you sure you want to unenroll from this course?')}
          <br />
          {t('This action cannot be undone.')}
        </DialogContentText>
      )}
      actions={
        <Button onClick={() => deleteResource()} autoFocus>
          {t('Unenroll')}
        </Button>
      }
    />
  );
};
