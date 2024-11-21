import { ArrowRight } from '@mui/icons-material';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Form } from './Form';
import { Result } from './Result';

import {
  QuizAssessResponse as AssessResponse,
  QuizDisplayResponse as DisplayResponse,
  QuizGetAssessData as GetAssessData,
  quizGetAssess as getAssess,
  quizGetDisplays as getDisplays,
  quizReadyAssess as readyAssess,
} from '@/api';
import { BaseDialog, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { VideoPlayer, VideoTracking } from '@/component/video';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('quiz');
  const theme = useTheme();
  const navigate = useNavigate();
  const { data, mutate } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id: open ? id : '' });

  const ready = () => {
    if (!data) return;
    readyAssess({ id: data.id }).then((updated: AssessResponse) => {
      mutate(updated, { revalidate: false });
      updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
    });
  };

  if (!open || !data) return null;

  const videoId = data.resources?.find((r) => r.kind === 'video')?.id ?? null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="smm"
      title={data.title}
      renderContent={() => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
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
            {videoId && (
              <Box sx={{ width: '100%', mb: 3 }}>
                <VideoPlayer id={videoId} sx={{ aspectRatio: '16/9' }} />
                <VideoTracking id={videoId} hidden />
                <Button
                  size="small"
                  sx={{ mt: 0.5, font: theme.typography.caption, display: 'flex', alignItems: 'center' }}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/video/${videoId}`);
                  }}
                >
                  {t('Go to video view')}
                  <ArrowRight fontSize="small" />
                </Button>
              </Box>
            )}

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
      )}
    />
  );
};
