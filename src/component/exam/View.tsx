import { ExamAssessResponse as AssessResponse, ExamGetAssessData as GetAssessData, examGetAssess as getAssess } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { generateRandomDarkColor } from '@/helper/util';
import { InfoOutlined } from '@mui/icons-material';
import { Box, GlobalStyles, Paper, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Form } from './Form';
import { Result } from './Result';

export const View = () => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const id = useParams().id as string;
  const { data } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id: id });
  const color = generateRandomDarkColor(data?.title, 1, 0.3);
  const inProgress = data?.status == 'ready' || data?.status == 'in_progress';

  if (!id || !data) return null;

  if (!data.status || !data.submission)
    return (
      <Typography
        variant="h5"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
          p: 5,
          justifyContent: 'center',
        }}
      >
        <InfoOutlined fontSize="large" />
        {t('You can access this page only when you start the exam.')}
      </Typography>
    );

  return (
    <Box sx={{ width: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <GlobalStyles styles={{ body: { backgroundColor: color } }} />
      <Paper sx={{ p: 4, maxWidth: 'md', width: '100%', borderRadius: theme.shape.borderRadius, position: 'relative' }}>
        <Typography variant="h5" sx={{ py: 1, mb: 3, fontWeight: 700, textAlign: 'center' }}>
          {data.title}
        </Typography>
        {inProgress ? <Form id={id} /> : <Result id={id} />}
      </Paper>
    </Box>
  );
};
