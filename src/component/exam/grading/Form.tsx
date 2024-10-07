import {
  ExamAssessResponse as AssessResponse,
  ExamGetGradingData as GetGradingData,
  ExamGradingSubmissionReponse as GradingSubmissionReponse,
  examGetGrading as getGrading,
  examGetGradingSubmissions as getGradingSubmissions,
  examSubmitGrading as submitGrading,
} from '@/api';
import { Form as CommonForm, TextFieldControl, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import i18next from '@/i18n';
import { yupResolver } from '@hookform/resolvers/yup';
import { ErrorOutlined } from '@mui/icons-material';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { FindingExplanationPanel } from '../FindingExplanationPanel';
import { FindingQuestionPanel } from '../FindingQuestionPanel';

const t = (key: string) => i18next.t(key, { ns: 'exam' });

const REQUIRED = t('This field is required.');

interface GradingInput {
  grading: {
    id: string;
    score: string;
    comment: string;
  }[];
}

const gradingSchema: yup.ObjectSchema<GradingInput> = yup.object({
  grading: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        comment: yup.string().default(''),
        score: yup
          .string()
          .required(REQUIRED)
          .test('score-min-max', t("Score must be between 0 and the question's weight."), (value, context) => {
            const findingItems = context.options.context?.findingItems;
            const item = findingItems.find(([id]: [id: string]) => id == context.parent.id);
            if (!item) return true;
            const { weight } = item[1];
            return Number(value) >= 0 && Number(value) <= weight;
          })
          .default(''),
      }),
    )
    .required()
    .default([]),
});

export const Form = ({ id, userId }: { id: string; userId: number }) => {
  const { t } = useTranslation('exam');
  const { data, mutate } = useServiceImmutable<GetGradingData, AssessResponse>(getGrading, {
    id,
    userId,
  });

  const submission = data?.submission;
  const grading = submission?.grading;
  const feedback = submission?.feedback;

  const submittedQuestions = submission?.questions.map((question) => question.id) || [];
  const findingItems = Object.entries(data?.finding || {})
    .filter(([id]) => submittedQuestions.includes(Number(id)))
    .sort(([a], [b]) => submittedQuestions.indexOf(Number(a)) - submittedQuestions.indexOf(Number(b)));

  const { handleSubmit, control, formState, setError, reset } = useForm<GradingInput>({
    resolver: yupResolver(gradingSchema),
    defaultValues: gradingSchema.getDefault(),
    context: { findingItems },
  });

  const submitGradingForm = (input: GradingInput) => {
    submitGrading({
      id,
      userId,
      requestBody: {
        grading: input.grading.reduce(
          (acc, { id, score }) => {
            acc[id] = Number(score);
            return acc;
          },
          {} as Record<string, number>,
        ),
        feedback: input.grading.reduce(
          (acc, { id, comment }) => {
            acc[id] = comment;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    })
      .then((updated) => {
        mutate(updated, { revalidate: false });
        updateInfiniteCache<GradingSubmissionReponse>(
          getGradingSubmissions,
          // temporary id from the server
          {
            id: `${id}:${userId}`,
            score: updated.score,
            status: updated.status,
            graded_time: updated.submission?.graded_time,
          },
          'update',
        );
      })
      .catch((e) => setError('root.server', { message: e.message }));
  };

  useEffect(() => {
    reset({
      grading: findingItems.map(([id]) => ({
        id,
        score: String(grading?.[id]) || '',
        comment: feedback?.[id] || '',
      })),
    });
    void formState.isValid;
  }, [data]); // eslint-disable-line

  if (!data || !data.finding) return null;

  return (
    <CommonForm onSubmit={handleSubmit(submitGradingForm)} formState={formState} setError={setError}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
        {t('Among the questions below, please grade the text input questions and essay questions and submit them.')}
      </Typography>
      <Stack
        spacing={3}
        divider={<Divider />}
        sx={{ p: 2, width: '100%', '& .MuiFormLabel-root': { mb: 2, fontWeight: 500, color: 'text.primary' } }}
      >
        {findingItems.map(([id, question], i) => {
          const { question: title, kind, occurrences, correct_answer, weight } = question;
          const maxOccurrence = Math.max(...occurrences);
          const totalOccurrence = occurrences.reduce((acc, cur) => acc + cur, 0);
          const answer = submission?.answers?.[id];
          const isCorrect = answer == correct_answer;

          return (
            <Box key={id} sx={{ display: 'flex', flexDirection: 'column', gap: 3, '& .percentage': { minWidth: 60 } }}>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {`${i + 1}. [${t(kind)}] ${title}`}
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'inline', ml: 1 }}>
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
              <Box>
                {grading?.[id] == null && (
                  <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1, display: 'flex', gap: 1 }}>
                    <ErrorOutlined />
                    {t('Please grade this question.')}
                  </Typography>
                )}
                <TextFieldControl
                  label={t('Score for this question.')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  variant="outlined"
                  name={`grading.${i}.score`}
                  control={control}
                  type="number"
                  required
                />
                <TextFieldControl
                  label={t('Comment for this question.')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  variant="outlined"
                  name={`grading.${i}.comment`}
                  control={control}
                  type="text"
                  multiline
                  placeholder={t('Optional')}
                />
              </Box>
              <FindingExplanationPanel question={question} />
            </Box>
          );
        })}
      </Stack>
      <Button
        fullWidth
        disabled={!formState.isDirty || formState.isSubmitting}
        type="submit"
        variant="contained"
        size="large"
        sx={{ my: 3 }}
      >
        {t('Submit grading')}
      </Button>
    </CommonForm>
  );
};
