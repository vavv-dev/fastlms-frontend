import { courseEnroll, courseGetDisplays } from '@/api';
import { BaseDialog, updateInfiniteCache } from '@/component/common';
import { userState } from '@/store';
import { Box, Button, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  title: string;
}

export const EnrollDialog = ({ open, setOpen, id, title }: Props) => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const closeDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  const enroll = async () => {
    courseEnroll({ id })
      .then(() => {
        setResult(t('You are now enrolled in this course.'));
        updateInfiniteCache(courseGetDisplays, { id, enrolled: true }, 'update');
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

  if (!user || !open) return null;

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      title={`${t('Enroll to {{ title }}', { title })}`}
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
                {!error && <Button onClick={() => navigate(`/course/${id}`)}>{t('Go to course learning page')}</Button>}
              </Box>
            )}

            {!result && (
              <Button onClick={enroll} variant="contained">
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
