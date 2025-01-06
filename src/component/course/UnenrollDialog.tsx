import { Button, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  courseGetDisplays as getDisplays,
  courseGetView as getView,
  courseUnenroll as unenroll,
} from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';
import { updateInfiniteCache } from '@/component/common/swr';
import { snackbarMessageState } from '@/component/layout';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const UnenrollDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const { data, mutate, isLoading, isValidating } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id });

  const unenrollCourse = useCallback(() => {
    unenroll({ id })
      .then(() => {
        updateInfiniteCache(getDisplays, { id, enrolled: false }, 'update');
        setSnackbarMessage({ message: t('You are now unenrolled from this course.'), duration: 3000 });
        mutate((prev) => prev && { ...prev, enrolled: false }, { revalidate: false });
        if (window.location.pathname === `/course/${id}`) navigate(-1);
      })
      .catch((error) => console.error(error))
      .finally(() => setOpen(false));
  }, [id, setOpen, setSnackbarMessage, t, mutate, navigate]);

  if (!open || !data?.enrolled) return null;

  return (
    <BaseDialog
      isReady={!isLoading && !isValidating}
      open={open}
      fullWidth
      maxWidth="xs"
      setOpen={setOpen}
      renderContent={() => (
        <Typography variant="subtitle1" sx={{}}>
          {t('Are you sure you want to unenroll from this course?')}
          <br />
          {t('This action cannot be undone.')}
        </Typography>
      )}
      actions={
        <Button onClick={() => unenrollCourse()} autoFocus>
          {t('Unenroll')}
        </Button>
      }
    />
  );
};
