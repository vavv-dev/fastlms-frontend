import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import MobileStepper from '@mui/material/MobileStepper';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  QuizAttemptResponse as AttemptResponse,
  QuizDisplayResponse as DisplayResponse,
  QuizGetAttemptData as GetAttemptData,
  quizGetAttempt as getAttempt,
  quizGetDisplays as getDisplays,
  quizSubmitAttempt as submitAttempt,
} from '@/api';
import {
  Form as CommonForm,
  RadioGroupControl as Radio,
  TextFieldControl as Text,
  updateInfiniteCache,
  useServiceImmutable,
} from '@/component/common';

interface AnswerInput {
  answers: {
    id: number;
    answer: string;
  }[];
}

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const schema: yup.ObjectSchema<AnswerInput> = yup.object({
    answers: yup
      .array()
      .of(yup.object({ id: yup.number().required(), answer: yup.string().required(REQUIRED) }))
      .required()
      .default([]),
  });

  return schema;
};

export const Form = ({ id }: { id: string }) => {
  const { t } = useTranslation('quiz');
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const submission = data?.submission;
  const [activeStep, setActiveStep] = useState<number>(0);
  const question = submission?.questions?.[activeStep];
  const maxSteps = submission?.questions?.length || 0;

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, formState, setError, reset, watch } = useForm<AnswerInput>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });
  const activeStepAnswer = watch(`answers.${activeStep}.answer`);

  useEffect(() => {
    if (!data) return;
    reset({
      answers: submission?.questions?.map((q) => ({ id: q.id, answer: '' })) || [],
    });
    void formState.isDirty;
  }, [data, reset]); // eslint-disable-line

  const submitForm = (input: AnswerInput) => {
    if (!data) return;

    submitAttempt({
      id: data.id,
      requestBody: {
        answers: input.answers.reduce(
          (acc, cur) => {
            acc[String(cur.id)] = String(cur.answer);
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    })
      .then(async (updated) => {
        await mutate(updated, { revalidate: false });
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
      })
      .catch((error) => setError('root.server', error));
  };

  return (
    <CommonForm id="attempt-form" onSubmit={handleSubmit(submitForm)} formState={formState} setError={setError}>
      {activeStep < maxSteps ? (
        <>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 7, whiteSpace: 'pre-wrap', maxWidth: '100%', wordBreak: 'break-word' }}>
              <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                {t('Question')} {activeStep + 1}
              </Typography>
              {question?.question}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
              {question?.kind === 'single_selection' ? t('Select the correct answer.') : t('Enter the correct answer.')}
            </Typography>
            {question?.kind === 'single_selection' ? (
              <Radio
                key={question.id}
                name={`answers.${activeStep}.answer`}
                control={control}
                selections={question.selections || []}
                helperText={question.help_text || null}
                kind="radio"
              />
            ) : question?.kind === 'number_input' ? (
              <Text
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
            variant="text"
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
            form="attempt-form"
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
    </CommonForm>
  );
};
