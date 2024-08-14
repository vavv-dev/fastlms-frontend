import { ExamAssessResponse, ExamGetAssessData, examGetAssess } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FindingExplanationPanel from './snippet/FindingExplanationPanel';
import FindingQuestionPanel from './snippet/FindingQuestionPanel';

const ExamFinding = ({ examId }: { examId: string }) => {
  const { t } = useTranslation('exam');
  const { data: exam } = useServiceImmutable<ExamGetAssessData, ExamAssessResponse>(examGetAssess, { id: examId });
  const submission = exam?.submission;
  const grading = submission?.grading;
  const feedback = submission?.feedback;

  const submittedQuestions = submission?.questions.map((question) => question.id) || [];
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const findingItem = Object.entries(exam?.finding || {})
    .filter(([id]) => showAllQuestions || submittedQuestions.includes(Number(id)))
    .sort(
      ([a], [b]) =>
        (submittedQuestions.includes(Number(b)) ? 1 : 0) - (submittedQuestions.includes(Number(a)) ? 1 : 0) ||
        submittedQuestions.indexOf(Number(a)) - submittedQuestions.indexOf(Number(b)),
    );

  if (!exam || !exam.finding) return null;

  return (
    <>
      {submittedQuestions.length != findingItem.length && (
        <Box sx={{ textAlign: 'right' }}>
          <Button onClick={() => setShowAllQuestions(!showAllQuestions)}>
            {showAllQuestions ? t('Show submitted questions only') : t('Show all questions')}
          </Button>
        </Box>
      )}
      <Stack
        spacing={3}
        divider={<Divider />}
        sx={{ p: 2, width: '100%', '& .MuiFormLabel-root': { mb: 2, fontWeight: 500, color: 'text.primary' } }}
      >
        {findingItem.map(([id, question], i) => {
          const { question: title, kind, occurrences, correct_answer, weight } = question;
          const maxOccurrence = Math.max(...occurrences);
          const totalOccurrence = occurrences.reduce((acc, cur) => acc + cur, 0);
          const answer = submission?.answers?.[id];
          const isCorrect = String(answer) == String(correct_answer);

          return (
            <Box key={id} sx={{ display: 'flex', flexDirection: 'column', gap: 3, '& .percentage': { minWidth: 60 } }}>
              <Typography>
                {`${i + 1}. [${t(kind)}] ${title}`}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'inline', ml: 1 }}>
                  {t('{{ num }} Points', { num: weight })}
                </Typography>
              </Typography>

              <FindingQuestionPanel
                question={question}
                maxOccurrence={maxOccurrence}
                totalOccurrence={totalOccurrence}
                answer={answer}
                isCorrect={isCorrect}
              />

              {submittedQuestions.includes(Number(id)) && (
                <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body1" color="primary">
                    {t('My points')} {grading?.[id] || 0} / {weight}
                  </Typography>
                  {feedback?.[id] && (
                    <Typography variant="body2" color="text.secondary">
                      {feedback?.[id]}
                    </Typography>
                  )}
                </Box>
              )}

              <FindingExplanationPanel question={question} />
            </Box>
          );
        })}
      </Stack>
    </>
  );
};

export default ExamFinding;
