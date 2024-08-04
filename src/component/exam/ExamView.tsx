import { ExamAssessResponse, ExamGetAssessData, examGetAssess } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { generateRandomDarkColor } from '@/helper/util';
import { Box, GlobalStyles, Paper, Typography, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import ExamForm from './ExamForm';
import ExamResult from './ExamResult';

const ExamView = () => {
  const theme = useTheme();
  const examId = useParams().examId as string;
  const { data: exam } = useServiceImmutable<ExamGetAssessData, ExamAssessResponse>(examGetAssess, { id: examId });
  const color = generateRandomDarkColor(exam?.title, 1, 0.3);
  const inProgress = exam?.status == 'ready' || exam?.status == 'in_progress';

  if (!exam || !exam.status || !exam.submission) return null;

  return (
    <Box sx={{ width: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <GlobalStyles styles={{ body: { backgroundColor: color } }} />
      <Paper sx={{ p: 4, maxWidth: 'md', width: '100%', borderRadius: theme.shape.borderRadius, position: 'relative' }}>
        <Typography variant="h5" sx={{ py: 1, mb: 3, fontWeight: 700, textAlign: 'center' }}>
          {exam.title}
        </Typography>
        {inProgress ? <ExamForm examId={examId} /> : <ExamResult examId={examId} />}
      </Paper>
    </Box>
  );
};

export default ExamView;
