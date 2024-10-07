import {
  SurveyAssessResponse as AssessResponse,
  SurveyDisplayResponse as DisplayResponse,
  SurveyGetAssessData as GetAssessData,
  surveyDeleteAssess as deleteAssess,
  surveyGetAssess as getAssess,
  surveyGetDisplays as getDisplays,
  surveyReadyAssess as readyAssess,
} from '@/api';
import { BaseDialog, WithAvatar, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale } from '@/helper/util';
import { ArrowRight, BarChartOutlined, EditNoteOutlined, KeyboardArrowRight, Refresh } from '@mui/icons-material';
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { VideoPlayer, VideoTracking } from '../video';
import { Finding } from './Finding';
import { Form } from './Form';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

const PLATFORM_NAME = import.meta.env.VITE_PLATFORM_NAME;

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('survey');
  const theme = useTheme();
  const navigate = useNavigate();
  const [showResult, setShowResult] = useState(false);
  const { data, mutate } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id: open ? id : '' });

  const ready = () => {
    if (!data) return;
    readyAssess({ id: data.id })
      .then((updated: AssessResponse) => {
        mutate(updated, { revalidate: false });
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
      })
      .catch((error) => {
        // TODO toast
        void error;
      });
  };

  const deleteSubmission = () => {
    deleteAssess({ id: id }).then(async () => {
      await mutate(
        (prev) => {
          if (!prev) return;
          return { ...prev, status: null, submission: null };
        },
        { revalidate: false },
      );
    });
  };

  if (!open || !data) return null;

  const videoId = data.resources?.find((r) => r.kind === 'video')?.id ?? null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="sm"
      title={data.title}
      renderContent={() => (
        <Box
          sx={{
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
              <VideoPlayer id={videoId} aspectRatio="16 / 9" />
              <VideoTracking id={videoId} hidden />
              <Button
                size="small"
                sx={{
                  mt: 0.5,
                  font: theme.typography.caption,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
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

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
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
                  <TableCell>{t('User')}</TableCell>
                  <TableCell sx={{ py: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '& *': { flexGrow: '0 !important' } }}>
                      <WithAvatar
                        variant="small"
                        username={data.owner.username}
                        name={data.owner.name}
                        thumbnail={data.owner.thumbnail}
                      />
                      @
                      <Typography
                        component="span"
                        variant="subtitle2"
                        onClick={() => navigate('/')}
                        sx={{ color: 'primary.main', cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        {PLATFORM_NAME}
                      </Typography>
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
      )}
    />
  );
};
