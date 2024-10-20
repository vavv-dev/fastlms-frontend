import {
  QuizAssessResponse as AssessResponse,
  QuizDisplayResponse as DisplayResponse,
  QuizGetAssessData as GetAssessData,
  quizDeleteAssess as deleteAssess,
  quizGetAssess as getAssess,
  quizGetDisplays as getDisplays,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale } from '@/helper/util';
import i18next from '@/i18n';
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import Button from '@mui/material/Button';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReward } from 'react-rewards';
import { Finding } from './Finding';

const t = (key: string) => i18next.t(key, { ns: 'quiz' });

const SUCCESS_MESSAGE = t('Congratulations! You have passed the quiz.');
const FAILURE_MESSAGE = t('Sorry! You have failed the quiz. Please try again after resetting the submission.');

export const Result = ({ id }: { id: string }) => {
  const { t } = useTranslation('quiz');
  const rewardRef = useRef<HTMLDivElement>(null);
  const { data, mutate } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id });
  const { reward } = useReward('passed-reward', 'confetti');
  const submission = data?.submission;
  const isPassed = data?.status == 'passed';
  const finalMessage = data?.final_message || (isPassed ? SUCCESS_MESSAGE : FAILURE_MESSAGE);

  const deleteSubmission = () => {
    if (!data?.submission) return;
    deleteAssess({ id: data.id }).then(() => {
      const cleaned = { ...data, submission: null, score: null, passed: null, status: null };
      mutate(cleaned, { revalidate: false });
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
                <TableCell>{data.cutoff_percent || 0} %</TableCell>
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
                  {isPassed ? t('Passed') : t('Failed')}
                  {isPassed && (
                    <IconButton onClick={reward} sx={{ ml: 2, height: 20, width: 20, fontSize: '1.2em' }}>
                      <Box ref={rewardRef} id="passed-reward" /> 🎉
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
      {data.finding && <Finding id={id} />}
    </>
  );
};
