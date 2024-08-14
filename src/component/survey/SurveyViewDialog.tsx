import { SurveyAssessResponse, SurveyGetAssessData, surveyDeleteAssess, surveyGetAssess, surveyReadyAssess } from '@/api';
import { BaseDialog, WithAvatar, useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale } from '@/helper/util';
import { BarChartOutlined, EditNoteOutlined, KeyboardArrowRight, Refresh } from '@mui/icons-material';
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SurveyFinding from './SurveyFinding';
import SurveyForm from './SurveyForm';

interface IProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  surveyId: string;
}

const PLATFORM_NAME = import.meta.env.VITE_PLATFORM_NAME;

const SurveyViewDialog = ({ open, setOpen, surveyId }: IProps) => {
  const { t } = useTranslation('survey');
  const theme = useTheme();
  const navigate = useNavigate();
  const [showResult, setShowResult] = useState(false);
  const { data: survey, mutate } = useServiceImmutable<SurveyGetAssessData, SurveyAssessResponse>(surveyGetAssess, {
    id: open ? surveyId : '',
  });

  const readySurvey = () => {
    if (!survey) return;
    surveyReadyAssess({ id: survey.id })
      .then((updated: SurveyAssessResponse) => {
        mutate(updated, { revalidate: false });
      })
      .catch((error) => {
        // TODO toast
        void error;
      });
  };

  const deleteSubmission = () => {
    surveyDeleteAssess({ id: surveyId }).then(async () => {
      await mutate(
        (prev) => {
          if (!prev) return;
          return { ...prev, status: null, submission: null };
        },
        { revalidate: false },
      );
    });
  };

  if (!open || !survey) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="sm"
      title={survey.title}
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {survey.title}
            {survey.description && (
              <Typography component="span" variant="body2" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
                {survey.description}
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
                  <TableCell>{t('Surveyor ')}</TableCell>
                  <TableCell sx={{ py: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '& *': { flexGrow: '0 !important' } }}>
                      <WithAvatar
                        variant="small"
                        username={survey.owner.username}
                        name={survey.owner.name}
                        thumbnail={survey.owner.thumbnail}
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
                  <TableCell>{`${formatDatetimeLocale(survey.start_date)} ~ ${formatDatetimeLocale(survey.end_date)}`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('Total submissions')}</TableCell>
                  <TableCell sx={{ py: 0 }}>
                    <Typography component="span" variant="body2" sx={{ mr: 2, fontWeight: 700 }}>
                      {t('{{ num }} people', { num: survey.submission_count?.toLocaleString() })}
                    </Typography>
                    {survey.status == 'passed' ? (
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
                    ) : survey.submission_count ? (
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
            <SurveyFinding surveyId={survey.id} />
          ) : !survey.status ? (
            <Button variant="text" onClick={readySurvey} endIcon={<KeyboardArrowRight />}>
              <Typography variant="h5" sx={{ my: 3 }}>
                {t("Let's start the survey!")}
              </Typography>
            </Button>
          ) : survey.status == 'passed' ? (
            <SurveyFinding surveyId={survey.id} />
          ) : (
            <SurveyForm surveyId={survey.id} />
          )}
        </Box>
      )}
    />
  );
};

export default SurveyViewDialog;
