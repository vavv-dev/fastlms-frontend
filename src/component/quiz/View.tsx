import { ArrowRight } from '@mui/icons-material';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Form } from './Form';
import { Result } from './Result';

import {
  QuizAttemptResponse as AttemptResponse,
  QuizDisplayResponse as DisplayResponse,
  QuizGetAttemptData as GetAttemptData,
  quizGetAttempt as getAttempt,
  quizGetDisplays as getDisplays,
  quizReadyAttempt as readyAttempt,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { courseResourceLocationState } from '@/component/course';
import { snackbarMessageState } from '@/component/layout';
import { VideoPlayer, VideoTracking } from '@/component/video';

export const View = ({ id }: { id: string }) => {
  const { t } = useTranslation('quiz');
  const theme = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  // course context
  const resourceLocation = useAtomValue(courseResourceLocationState);

  const ready = () => {
    if (!data) return;

    // set course context
    const match = pathname.match(/\/course\/([^/]+)\/player/);
    const context =
      match && resourceLocation && resourceLocation.resource_id === data.id
        ? { course_id: match[1], lesson_id: resourceLocation.lesson_id }
        : null;

    readyAttempt({ id: data.id, requestBody: { context } })
      .then((updated: AttemptResponse) => {
        mutate(updated, { revalidate: false });
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
      })
      .catch((error) => {
        setSnackbarMessage({
          message: t('Failed to start the quiz. {{ message }}', { message: error.message }),
          duration: 3000,
        });
      });
  };

  if (!data) return null;

  const videoId = data.resources?.find((r) => r.kind === 'video')?.id ?? null;

  return (
    <Box
      sx={{
        p: 3,
        pt: 2,
        width: '100%',
        maxWidth: 'smm',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 350,
        gap: 3,
        '& form, & form > fieldset': {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flex: '1 0 0',
          width: '100%',
          gap: 3,
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {videoId && (
          <Box sx={{ width: '100%', mb: 3, '& .player-wrapper': { maxWidth: '100%' } }}>
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
        </Typography>

        {data.status == null ? (
          <>
            <Button variant="text" onClick={ready} endIcon={<KeyboardArrowRight />}>
              <Typography variant="h5">{t("Let's start the quiz!")}</Typography>
            </Button>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              {t("This quiz's cutoff score is {{ cutoff }}%.", { cutoff: data.cutoff_score || 0 })}
            </Typography>
            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', maxWidth: '100%', wordBreak: 'break-word' }}>
              {data.description}
            </Typography>
          </>
        ) : ['passed', 'failed'].includes(data.status) ? (
          <Result id={data.id} />
        ) : (
          <Form id={data.id} />
        )}
      </Box>
    </Box>
  );
};
