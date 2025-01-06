import { Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ExamQuestionFinding as QuestionFinding } from '@/api';

export const FindingExplanationPanel = ({ question }: { question: QuestionFinding }) => {
  const { t } = useTranslation('exam');

  return (
    <TableContainer
      sx={{
        '& td:nth-of-type(1)': { whiteSpace: 'nowrap', fontWeight: 600 },
        '& td:nth-of-type(2)': { whiteSpace: 'pre-wrap' },
        '& tr:last-child td': { border: 'none' },
        p: 1,
        bgcolor: 'action.hover',
        borderRadius: 2,
      }}
    >
      <Table size="small">
        <TableBody>
          {question.correct_answer && (
            <TableRow>
              <TableCell>{t('Correct answer')}</TableCell>
              <TableCell>{question.correct_answer}</TableCell>
            </TableRow>
          )}
          {question.explanation && (
            <TableRow>
              <TableCell>{t('Explanation')}</TableCell>
              <TableCell>{question.explanation}</TableCell>
            </TableRow>
          )}
          {question.answer_criteria && (
            <TableRow>
              <TableCell>{t('Answer criteria')}</TableCell>
              <TableCell>{question.answer_criteria}</TableCell>
            </TableRow>
          )}
          {question.grading_method && (
            <TableRow>
              <TableCell>{t('Grading method')}</TableCell>
              <TableCell>{question.grading_method}</TableCell>
            </TableRow>
          )}
          {question.reference && (
            <TableRow>
              <TableCell>{t('Reference location')}</TableCell>
              <TableCell>{`${t('Lesson')} ${question.reference}`}</TableCell>
            </TableRow>
          )}
          {question.keywords && (
            <TableRow>
              <TableCell>{t('Keywords')}</TableCell>
              <TableCell>{question.keywords}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
