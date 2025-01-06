import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Divider, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { StopWatch } from './StopWatch';

import {
  ExamAttemptResponse as AttemptResponse,
  ExamDisplayResponse as DisplayResponse,
  ExamGetAttemptData as GetAttemptData,
  examGetAttempt as getAttempt,
  examGetDisplays as getDisplays,
  examSubmitAttempt as submitAttempt,
} from '@/api';
import {
  BaseDialog,
  Form as CommonForm,
  RadioGroupControl as Radio,
  TextFieldControl as Text,
  TextEditorControl as TextEditor,
  updateInfiniteCache,
  useScrollToFirstError,
  useServiceImmutable,
} from '@/component/common';
import { alertState } from '@/component/layout';

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
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [answerState, setAnswerState] = useState<React.ReactNode | null>(null);
  const setAlert = useSetAtom(alertState);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, formState, setError, reset, getValues, watch } = useForm<AnswerInput>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: yupResolver(schema),
  });
  const submission = data?.submission;

  // fix mui rhf ref issue
  useScrollToFirstError(formState.errors);

  // load saved answers
  useEffect(() => {
    reset({
      answers: submission?.questions.map((question) => ({
        id: question.id,
        answer: submission?.answers[question.id],
      })),
    });
  }, [data, reset, submission]);

  useEffect(() => {
    void formState.isValid;
  }, [formState]);

  useEffect(() => {
    let prevDirtyCount = 0;
    const subscription = watch((value) => {
      if (!value.answers) return;
      const dirtyCount = value.answers.filter((answer) => !!answer?.answer).length;
      if (dirtyCount === prevDirtyCount) return;
      prevDirtyCount = value.answers.filter((answer) => !!answer?.answer).length;
      setAnswerState(
        value.answers.map((answer, i) =>
          !answer?.answer ? (
            <Tooltip title={t('Question {{ num }}. is not answered', { num: i + 1 })} key={i} arrow>
              <Box
                onClick={() => {
                  const b = document.querySelector(`[name="answers.${i}.answer"]`);
                  b?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              />
            </Tooltip>
          ) : (
            <Box sx={{ bgcolor: 'primary.light' }} key={i} />
          ),
        ),
      );
    });
    return () => {
      subscription.unsubscribe();
      setAnswerState(null);
    };
  }, [watch]); // eslint-disable-line

  const confirmSubmit = () => {
    handleSubmit(submitForm)();
  };

  const submitForm = async (input: AnswerInput) => {
    if (!data) return;

    // exam dialog
    const examPaper = submitButtonRef.current?.closest('.exam-paper');

    await submitAttempt({
      id: data.id,
      requestBody: {
        answers: input.answers.reduce(
          (acc, cur) => {
            acc[String(cur.id)] = cur.answer;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    })
      .then(async (updated) => {
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
        await mutate(updated, { revalidate: false });
        // scroll to top
        examPaper?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });

        // clean exam alert
        setAlert({ open: false, message: '', severity: 'info' });
      })
      .catch((error) => setError('root.server', error));
    setSubmitConfirmOpen(false);
  };

  if (!data || !data.status || !submission) return null;

  return (
    <>
      <Divider sx={{ mb: 3, width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <CommonForm onSubmit={handleSubmit(() => setSubmitConfirmOpen(true))} formState={formState} setError={setError}>
        <Stack
          spacing={3}
          divider={<Divider />}
          sx={{
            px: { xs: 0, sm: 2, lg: 3 },
            '& .MuiFormLabel-root': { mb: 2, fontWeight: 600, color: 'text.primary', whiteSpace: 'pre-wrap' },
          }}
        >
          {submission.questions.map((question, i) => {
            const name = `answers.${i}.answer`;
            const formLabel = `${i + 1}. ${question.question} (${t('{{ point }} points', { point: question.weight })})`;

            return (
              <Box key={question.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {question.kind == 'single_selection' || question.kind == 'ox_selection' ? (
                  <Radio
                    name={name}
                    formLabel={formLabel}
                    required
                    control={control}
                    selections={question.selections || []}
                    helperText={question.help_text || null}
                    kind="radio"
                  />
                ) : data.sub_kind == 'assignment' && question.kind == 'essay' ? (
                  <TextEditor
                    formLabel={formLabel}
                    name={name}
                    required
                    control={control}
                    helperText={question.help_text || null}
                    minHeight={150}
                    disableFormLabelFocus
                    sx={{ my: 1 }}
                  />
                ) : (
                  <Text
                    variant="outlined"
                    name={name}
                    formLabel={formLabel}
                    required
                    control={control}
                    type={question.kind == 'number_input' ? 'number' : 'text'}
                    helperText={question.help_text || null}
                    {...(question.kind == 'essay' ? { multiline: true, minRows: 4 } : {})}
                  />
                )}
              </Box>
            );
          })}
          <Box sx={{ position: 'sticky', bottom: '1em' }}>
            <Box
              sx={{
                '& *': { flex: 1 },
                width: '100%',
                height: '100%',
                position: 'absolute',
                display: 'flex',
                bottom: 0,
                left: 0,
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {answerState}
            </Box>
            <Button
              ref={submitButtonRef}
              fullWidth
              disabled={!formState.isDirty || formState.isSubmitting || !formState.isValid}
              type="submit"
              variant="contained"
              size="large"
            >
              {t('Submit')}
            </Button>
          </Box>
        </Stack>
      </CommonForm>
      {submitConfirmOpen && (
        <BaseDialog
          isReady
          maxWidth="xs"
          fullWidth
          open={submitConfirmOpen}
          setOpen={setSubmitConfirmOpen}
          renderContent={() => (
            <Typography variant="body1">
              {t('Are you sure you want to submit answers? If submitted, the exam will be finished.')}
              <br />
              {t('This action cannot be undone.')}
            </Typography>
          )}
          actions={
            <Box sx={{ display: 'flex', gap: 2, mx: 'auto', pb: 3 }}>
              <Button onClick={() => setSubmitConfirmOpen(false)}>{t('Cancel')}</Button>
              <Button onClick={confirmSubmit} variant="contained">
                {t('Submit')}
              </Button>
            </Box>
          }
          sx={{ zIndex: theme.zIndex.modal + 1 }}
        />
      )}
      <StopWatch id={id} getValues={getValues} />
    </>
  );
};
