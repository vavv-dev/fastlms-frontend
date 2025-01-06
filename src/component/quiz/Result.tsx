import { Box, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import Button from '@mui/material/Button';
import { useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReward } from 'react-rewards';

import { Finding } from './Finding';

import {
  QuizAttemptResponse as AttemptResponse,
  QuizDisplayResponse as DisplayResponse,
  QuizGetAttemptData as GetAttemptData,
  quizDeleteAttempt as deleteAttempt,
  quizGetAttempt as getAttempt,
  quizGetDisplays as getDisplays,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { courseExamResetState } from '@/component/course';
import { formatDatetimeLocale } from '@/helper/util';

export const Result = ({ id }: { id: string }) => {
  const { t } = useTranslation('quiz');
  const rewardRef = useRef<HTMLDivElement>(null);
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const { reward } = useReward('passed-reward', 'confetti');
  const submission = data?.submission;
  const isPassed = data?.status == 'passed';
  const setCourseExamReset = useSetAtom(courseExamResetState);

  const SUCCESS_MESSAGE = t('Congratulations! You have passed the quiz.');
  const FAILURE_MESSAGE = t('Sorry! You have failed the quiz. Please try again after resetting the submission.');

  const finalMessage = data?.final_message || (isPassed ? SUCCESS_MESSAGE : FAILURE_MESSAGE);

  const deleteSubmission = () => {
    if (!data?.submission) return;
    deleteAttempt({ id: data.id }).then(() => {
      const cleaned = { ...data, submission: null, score: null, passed: null, status: null, context: null };
      mutate(cleaned, { revalidate: false }).then(() => setCourseExamReset(data.id));
      updateInfiniteCache<DisplayResponse>(getDisplays, cleaned, 'update');
    });
  };

  useEffect(() => {
    if (isPassed) {
      setTimeout(reward, 0.5 * 1000);
    }
  }, [data, reward, isPassed]);

  if (!data || !submission) return null;

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', p: 2 }}>
        {finalMessage && (
          <Box
            className="tiptap-content"
            dangerouslySetInnerHTML={{ __html: finalMessage }}
            sx={{ whiteSpace: 'pre-wrap', maxWidth: '100%', wordBreak: 'break-word' }}
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
                <TableCell>{data.cutoff_score || 0}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('My score')}</TableCell>
                <TableCell>
                  {data.submission?.earned_score} / {data.submission?.possible_score} {t('points')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('Result')}</TableCell>
                <TableCell sx={{ color: isPassed ? 'success.main' : 'error.main', fontWeight: 600 }}>
                  <Chip
                    label={isPassed ? t('Passed') : t('Failed')}
                    color={isPassed ? 'success' : 'error'}
                    sx={{ fontWeight: 'bold', fontSize: '1rem', py: 0.5, px: 1 }}
                  />
                  {isPassed && (
                    <IconButton onClick={reward} sx={{ ml: 2, height: 20, width: 20, fontSize: '1.2em' }}>
                      <Box ref={rewardRef} id="passed-reward" /> 🎉
                    </IconButton>
                  )}
                  <Button sx={{ ml: 2, height: 20 }} color="warning" variant="text" onClick={deleteSubmission}>
                    {t('Retry')}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {data.finding && <Finding id={id} />}
    </>
  );
};
