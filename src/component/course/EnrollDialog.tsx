import { Box, Button, Tooltip, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { AuthBox } from './emon/AuthBox';

import {
  CourseEnrollResponse as EnrollResponse,
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  courseEnroll as enroll,
  courseGetDisplays as getDisplays,
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
  const [error, setError] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authLoadState, setAuthLoadState] = useState<number | null>(null);

  const {
    data: course,
    mutate: courseMutate,
    isLoading,
    isValidating,
  } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });

  const closeDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  const handleEnrollClick = () => {
    if (!course) return;

    if (course.emon_managed_course) {
      setAuthOpen(true);
    } else {
      enrollCourse();
    }
  };

  const enrollCourse = async (enrollemntToken?: string) => {
    enroll({ id, requestBody: { enrollment_token: enrollemntToken } })
      .then((r: EnrollResponse) => {
        const updated = {
          enrolled: true,
          learning_start: r.learning_start,
          learning_end: r.learning_end,
        };
        updateInfiniteCache(getDisplays, { id, ...updated }, 'update');
        courseMutate((prev) => prev && { ...prev, ...updated }, { revalidate: false });
        onEnroll?.();
        navigate(`/course/${id}`, { replace: window.location.pathname === `/course/${id}` });
      })
      .catch((err) => {
        switch (err.status) {
          case 409:
            navigate(`/course/${id}`);
            break;
          case 400:
          case 401:
          case 404:
            setError(err.status);
            break;
        }
      });
  };

  if (!user || !open || !course || course.enrolled) return null;

  if (authLoadState === 201 || authLoadState === 203) return null;

  return (
    <>
      <BaseDialog
        isReady={!isLoading && !isValidating}
        open={open}
        setOpen={setOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        renderContent={() => (
          <>
            {authOpen && (
              <Box sx={{ display: authLoadState ? 'block' : 'none' }}>
                <AuthBox
                  course={course}
                  user={user}
                  learningType="00"
                  learningSequence={0}
                  onAuthComplete={(authData) => {
                    setAuthLoadState(203); // tricky way. fix flickering
                    enrollCourse(authData?.enrollment_token as string);
                  }}
                  setLoadState={setAuthLoadState}
                />
              </Box>
            )}

            {authLoadState == null && (
              <>
                <Typography variant="h6" sx={{ textAlign: 'center' }}>
                  {course.title}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {error ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                      <Typography variant="body2" color={error ? 'error' : 'success'}>
                        {error === 400
                          ? t('Bad request')
                          : error === 401
                            ? t('You do not have permission.')
                            : error === 404
                              ? t('Course not found.')
                              : t('Something went wrong. Try again after refreshing the page.')}
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
                  ) : (
                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                      <Tooltip
                        placement="top"
                        arrow
                        title={t('You can review the course information and return later to complete registration.')}
                      >
                        <Button onClick={() => navigate(`/course/${id}/outline`)}>{t('View course info')}</Button>
                      </Tooltip>
                      <Button onClick={handleEnrollClick} variant="contained">
                        {t('Enroll to this course')}
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      />
    </>
  );
};
