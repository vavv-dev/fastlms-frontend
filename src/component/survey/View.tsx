import { ArrowRight, BarChartOutlined, EditNoteOutlined, KeyboardArrowRight, Refresh } from '@mui/icons-material';
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Finding } from './Finding';
import { Form } from './Form';

import {
  SurveyAttemptResponse as AttemptResponse,
  SurveyDisplayResponse as DisplayResponse,
  SurveyGetAttemptData as GetAttemptData,
  surveyDeleteAttempt as deleteAttempt,
  surveyGetAttempt as getAttempt,
  surveyGetDisplays as getDisplays,
  surveyReadyAttempt as readyAttempt,
} from '@/api';
import { WithAvatar, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { VideoPlayer, VideoTracking } from '@/component/video';
import { formatDatetimeLocale } from '@/helper/util';

export const View = ({ id }: { id: string }) => {
  const { t } = useTranslation('survey');
  const theme = useTheme();
  const navigate = useNavigate();
  const [showResult, setShowResult] = useState(false);
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  const ready = () => {
    if (!data) return;
    readyAttempt({ id: data.id })
      .then((updated: AttemptResponse) => {
        mutate(updated, { revalidate: false });
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
      })
      .catch((error) => {
        setSnackbarMessage({
          message: t('Failed to start the survey. {{ message }}', { message: error.message }),
          duration: 3000,
        });
      });
  };

  const deleteSubmission = () => {
    if (!data?.submission) return;
    deleteAttempt({ id: id }).then(() => {
      const cleaned = { ...data, submission: null, score: null, passed: null, status: null };
      mutate(cleaned, { revalidate: false });
      updateInfiniteCache<DisplayResponse>(getDisplays, cleaned, 'update');
    });
  };

  if (!data) return null;

  const videoId = data.resources?.find((r) => r.kind === 'video')?.id ?? null;

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 3,
        width: '100%',
        maxWidth: 'smm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        '& form, & form > fieldset': { width: '100%' },
      }}
    >
      {videoId && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <VideoPlayer id={videoId} sx={{ aspectRatio: '16/9' }} />
          <VideoTracking id={videoId} hidden />
          <Button
            size="small"
            sx={{ mt: 0.5, font: theme.typography.caption, display: 'flex', alignItems: 'center' }}
            onClick={() => navigate(`/video/${videoId}`)}
          >
            {t('Go to video view')}
            <ArrowRight fontSize="small" />
          </Button>
        </Box>
      )}

      <Typography variant="h6" sx={{ fontWeight: 600, my: 3 }}>
        {data.title}
        {data.description && (
          <Typography component="span" variant="body2" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
            {data.description}
          </Typography>
        )}
      </Typography>

      <TableContainer
        sx={{
          '& td': { border: 'none', color: 'text.secondary', fontSize: theme.typography.subtitle2.fontSize },
          '& .avatar': { width: '28px', height: '28px' },
          borderRadius: theme.shape.borderRadius / 2,
          width: 'auto',
        }}
      >
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>{t('Surveyer')}</TableCell>
              <TableCell sx={{ py: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WithAvatar variant="small" {...data.owner} />
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('Period')}</TableCell>
              <TableCell>{`${formatDatetimeLocale(data.start_date)} ~ ${formatDatetimeLocale(data.end_date)}`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('Total submissions')}</TableCell>
              <TableCell sx={{ py: 0 }}>
                <Typography component="span" variant="body2" sx={{ mr: 2, fontWeight: 700 }}>
                  {t('{{ num }} people', { num: data.submission_count?.toLocaleString() })}
                </Typography>
                {data.status == 'passed' ? (
                  <Button
                    onClick={deleteSubmission}
                    startIcon={<Refresh />}
                    variant="outlined"
                    size="small"
                    color="error"
                    sx={{ lineHeight: 1.2, borderRadius: theme.shape.borderRadius / 2 }}
                  >
                    {t('Delete submission and retry')}
                  </Button>
                ) : showResult ? (
                  <Button
                    onClick={() => setShowResult(!showResult)}
                    startIcon={<EditNoteOutlined />}
                    variant="outlined"
                    size="small"
                    sx={{ lineHeight: 1.2, borderRadius: theme.shape.borderRadius / 2 }}
                  >
                    {t('Paticipate to survey')}
                  </Button>
                ) : data.submission_count ? (
                  <Button
                    onClick={() => setShowResult(!showResult)}
                    startIcon={<BarChartOutlined />}
                    variant="contained"
                    size="small"
                    sx={{ lineHeight: 1.2, borderRadius: theme.shape.borderRadius / 2 }}
                  >
                    {t('View survey result')}
                  </Button>
                ) : undefined}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      {showResult ? (
        <Finding id={data.id} />
      ) : !data.status ? (
        <Button variant="text" onClick={ready} endIcon={<KeyboardArrowRight />} sx={{ my: 3 }}>
          <Typography variant="h5">{t("Let's start the survey!")}</Typography>
        </Button>
      ) : data.status == 'passed' ? (
        <Finding id={data.id} />
      ) : (
        <Form id={data.id} />
      )}
    </Box>
  );
};
