import {
  QuizAssessResponse,
  QuizDisplayResponse,
  QuizGetAssessData,
  quizDeleteAssess,
  quizGetAssess,
  quizGetDisplay,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale } from '@/helper/util';
import i18next from '@/i18n';
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import Button from '@mui/material/Button';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReward } from 'react-rewards';
import QuizFinding from './QuizFinding';

const t = (key: string) => i18next.t(key, { ns: 'quiz' });

const SUCCESS_MESSAGE = t('Congratulations! You have passed the quiz.');
const FAILURE_MESSAGE = t('Sorry! You have failed the quiz. Please try again after resetting the submission.');

const QuizResult = ({ quizId }: { quizId: string }) => {
  const { t } = useTranslation('quiz');
  const rewardRef = useRef<HTMLDivElement>(null);
  const { data: quiz, mutate } = useServiceImmutable<QuizGetAssessData, QuizAssessResponse>(quizGetAssess, { id: quizId });
  const { reward } = useReward('quiz-passed-reward', 'confetti');
  const submission = quiz?.submission;
  const isPassed = quiz?.status == 'passed';
  const finalMessage = quiz?.final_message || (isPassed ? SUCCESS_MESSAGE : FAILURE_MESSAGE);

  const deleteSubmission = () => {
    if (!quiz?.submission) return;
    quizDeleteAssess({ id: quiz.id }).then(() => {
      const cleaned = { ...quiz, submission: null, score: null, passed: null, status: null };
      mutate(cleaned, { revalidate: false });
      updateInfiniteCache<QuizDisplayResponse>(quizGetDisplay, cleaned, 'update');
    });
  };

  useEffect(() => {
    if (isPassed) {
      setTimeout(reward, 0.5 * 1000);
    }
  }, [quiz, reward, isPassed]);

  if (!quiz || !submission) return null;

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', p: 2 }}>
        {finalMessage && (
          <Box
            sx={{ whiteSpace: 'pre-wrap', maxWidth: '100%', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: finalMessage }}
          />
        )}
        <TableContainer sx={{ width: 'inherit' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>{t('Submit date')}</TableCell>
                <TableCell>{formatDatetimeLocale(submission?.end_time)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Cutoff %')}</TableCell>
                <TableCell>{quiz.cutoff_percent || 0} %</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('My score')}</TableCell>
                <TableCell>
                  {quiz.submission?.earned_score} / {quiz.submission?.possible_score} {t('points')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Result')}</TableCell>
                <TableCell sx={{ color: isPassed ? 'success.main' : 'error.main', fontWeight: 600 }}>
                  {isPassed ? t('Passed') : t('Failed')}
                  {isPassed && (
                    <IconButton onClick={reward} sx={{ ml: 2, height: 20, width: 20, fontSize: '1.2em' }}>
                      <Box ref={rewardRef} id="quiz-passed-reward" /> 🎉
                    </IconButton>
                  )}
                  <Button sx={{ ml: 2, height: 20 }} color="warning" variant="text" onClick={deleteSubmission}>
                    {t('Reset')}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {quiz.finding && <QuizFinding quizId={quizId} />}
    </>
  );
};

export default QuizResult;
