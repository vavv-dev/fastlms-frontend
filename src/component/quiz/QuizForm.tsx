import {
  QuizAssessResponse,
  QuizDisplayResponse,
  QuizGetAssessData,
  quizGetAssess,
  quizGetDisplay,
  quizSubmitAssess,
} from '@/api';
import { Form, SelectGroupControl, TextFieldControl, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import i18next from '@/i18n';
import { userState } from '@/store';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import MobileStepper from '@mui/material/MobileStepper';
import Typography from '@mui/material/Typography';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'quiz' });

const REQUIRED = t('This field is required.');

interface AnswerInput {
  answers: {
    id: number;
    answer: string;
  }[];
}

const quizSubmitSchema: yup.ObjectSchema<AnswerInput> = yup.object({
  answers: yup
    .array()
    .of(yup.object({ id: yup.number().required(), answer: yup.string().required(REQUIRED) }))
    .required()
    .default([]),
});

const QuizForm = ({ quizId }: { quizId: string }) => {
  const { t } = useTranslation('quiz');
  const { data: quiz, mutate } = useServiceImmutable<QuizGetAssessData, QuizAssessResponse>(quizGetAssess, { id: quizId });
  const submission = quiz?.submission;
  const [activeStep, setActiveStep] = useState<number>(0);
  const question = submission?.questions?.[activeStep];
  const maxSteps = submission?.questions?.length || 0;
  const user = useAtomValue(userState);

  const { handleSubmit, control, formState, setError, reset, watch } = useForm<AnswerInput>({
    resolver: yupResolver(quizSubmitSchema),
    defaultValues: quizSubmitSchema.getDefault(),
  });
  const activeStepAnswer = watch(`answers.${activeStep}.answer`);

  useEffect(() => {
    if (!quiz) return;
    reset({
      answers: submission?.questions?.map((q) => ({ id: q.id, answer: '' })) || [],
    });
    void formState.isDirty;
  }, [quiz, reset]); // eslint-disable-line

  const submitQuiz = (data: AnswerInput) => {
    if (!user || !quiz) return;

    quizSubmitAssess({
      id: quiz.id,
      requestBody: {
        answers: data.answers.reduce(
          (acc, cur) => {
            acc[String(cur.id)] = String(cur.answer);
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    })
      .then(async (updated: QuizAssessResponse) => {
        await mutate(updated, { revalidate: false });
        updateInfiniteCache<QuizDisplayResponse>(quizGetDisplay, updated, 'update');
      })
      .catch((error) => {
        setError('root.server', error.body);
      });
  };

  return (
    <Form id="quiz-assess-form" onSubmit={handleSubmit(submitQuiz)} formState={formState} setError={setError}>
      {activeStep < maxSteps ? (
        <>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 3, whiteSpace: 'pre-wrap', maxWidth: '100%', wordBreak: 'break-word' }}>
              <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                {t('Question')} {activeStep + 1}
              </Typography>
              {question?.question}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {question?.kind === 'single_selection' ? t('Select the correct answer.') : t('Enter the correct answer.')}
            </Typography>
            {question?.kind === 'single_selection' ? (
              <SelectGroupControl
                key={question.id}
                name={`answers.${activeStep}.answer`}
                control={control}
                selections={question.selections || []}
                helperText={question.help_text || null}
                kind="radio"
              />
            ) : question?.kind === 'number_input' ? (
              <TextFieldControl
                variant="outlined"
                key={question.id}
                name={`answers.${activeStep}.answer`}
                control={control}
                type="number"
                helperText={question.help_text || null}
              />
            ) : undefined}
          </Box>
          <MobileStepper
            sx={{ width: '100%' }}
            variant={'text'}
            steps={maxSteps}
            position="static"
            activeStep={activeStep}
            nextButton={
              <Button
                disabled={activeStepAnswer === undefined || activeStepAnswer === ''}
                size="small"
                onClick={() => setActiveStep(activeStep + 1)}
              >
                {t('Next')}
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button disabled={activeStep < 1} size="small" onClick={() => setActiveStep(activeStep - 1)}>
                <KeyboardArrowLeft />
                {t('Back')}
              </Button>
            }
          />
        </>
      ) : (
        <>
          <Button
            form="quiz-assess-form"
            disabled={!formState.isDirty || formState.isSubmitting}
            type="submit"
            endIcon={<KeyboardArrowRight />}
          >
            <Typography variant="h5">{t('Submit your answers')}</Typography>
          </Button>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {t("If submitted, you can see the quiz's insight.")}
          </Typography>
          <Button onClick={() => setActiveStep(maxSteps - 1)} size="small" color="warning" startIcon={<KeyboardArrowLeft />}>
            {t('Back to the quiz')}
          </Button>
        </>
      )}
    </Form>
  );
};

export default QuizForm;
