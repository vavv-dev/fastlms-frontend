import { Box, Button, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  CourseEnrollResponse as EnrollResponse,
  CourseGetNewEnrolledCountData as GetNewEnrolledCountData,
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  courseEnroll as enroll,
  courseGetDisplays as getDisplays,
  courseGetNewEnrolledCount as getNewEnrolledCount,
  courseGetView as getView,
} from '@/api';
import { BaseDialog, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { userState } from '@/store';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  onEnroll?: () => void;
}

export const EnrollDialog = ({ open, setOpen, id, onEnroll }: Props) => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const { mutate: countMutate } = useServiceImmutable<GetNewEnrolledCountData, number>(getNewEnrolledCount, undefined);
  const { data: course, mutate: courseMutate } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id });

  const closeDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  const enrollCourse = async () => {
    enroll({ id })
      .then((r: EnrollResponse) => {
        const updated = {
          enrolled: true,
          study_start: r.study_start,
          study_end: r.study_end,
        };
        setResult(t('You are now enrolled in this course.'));
        updateInfiniteCache(getDisplays, { id, ...updated }, 'update');
        countMutate(1, { revalidate: false });
        courseMutate((prev) => prev && { ...prev, ...updated }, { revalidate: false });
        onEnroll?.();
        navigate(`/course/${id}`, { replace: window.location.pathname === `/course/${id}` });
      })
      .catch((err) => {
        switch (err.status) {
          case 409:
            setResult(t('You are already enrolled in this course.'));
            break;
          case 404:
          case 400:
            setError(true);
            setResult(t('Bad request.'));
            break;
          case 401:
            setError(true);
            setResult(t('You are not logged in.'));
            break;
        }
      });
  };

  if (!user || !open || course?.enrolled) return null;

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      title={t('Course enrollment')}
      fullWidth
      maxWidth="sm"
      renderContent={() => (
        <Box>
          <Typography variant="body1">Course enrollment process</Typography>
          <Typography variant="body2">Working on it...</Typography>

          <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color={error ? 'error' : 'success'}>
                  {result}
                </Typography>
                {!error && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course/${id}`);
                    }}
                  >
                    {t('Go to course learning page')}
                  </Button>
                )}
              </Box>
            )}

            {!result && (
              <Button onClick={enrollCourse} variant="contained">
                {t('Enroll to this course')}
              </Button>
            )}
          </Box>
        </Box>
      )}
      actions={<Button onClick={closeDialog}>{t('Cancel')}</Button>}
    />
  );
};
