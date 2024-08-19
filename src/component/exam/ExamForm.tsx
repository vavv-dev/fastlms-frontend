import {
  ExamAssessResponse,
  ExamDisplayResponse,
  ExamGetAssessData,
  examGetAssess,
  examGetDisplays,
  examSubmitAssess,
} from '@/api';
import {
  BaseDialog,
  Form,
  GradientCircularProgress,
  SelectGroupControl,
  TextEditorControl,
  TextFieldControl,
} from '@/component/common';
import { updateInfiniteCache, useScrollToFirstError, useServiceImmutable } from '@/component/common/hooks';
import i18next from '@/i18n';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, DialogContentText, Divider, Stack, Tooltip, Typography, Zoom, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import StopWatch from './StopWatch';

const t = (key: string) => i18next.t(key, { ns: 'exam' });

const REQUIRED = t('This field is required.');

interface AnswerInput {
  answers: {
    id: number;
    answer: string;
  }[];
}

const answerInputSchema: yup.ObjectSchema<AnswerInput> = yup.object({
  answers: yup
    .array()
    .of(yup.object({ id: yup.number().required(), answer: yup.string().required(REQUIRED) }))
    .required()
    .default([]),
});

const ExamForm = ({ examId }: { examId: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { data: exam, mutate } = useServiceImmutable<ExamGetAssessData, ExamAssessResponse>(examGetAssess, { id: examId });
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [answerState, setAnswerState] = useState<React.ReactNode | null>(null);
  const { handleSubmit, control, formState, setError, reset, getValues, watch } = useForm<AnswerInput>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: yupResolver(answerInputSchema),
  });
  const submission = exam?.submission;

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
  }, [exam, reset, submission]);

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
                sx={{ cursor: 'pointer' }}
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

  const confirmSubmitExam = () => {
    handleSubmit(submitExam)();
  };

  const submitExam = async (data: AnswerInput) => {
    if (!exam) return;

    await examSubmitAssess({
      id: exam.id,
      requestBody: {
        answers: data.answers.reduce(
          (acc, cur) => {
            acc[String(cur.id)] = cur.answer;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    })
      .then(async (updated) => {
        // Attention exam end!!!
        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateInfiniteCache<ExamDisplayResponse>(examGetDisplays, updated, 'update');
        await mutate(updated, { revalidate: false });
      })
      .catch((error) => {
        setError('root.server', error.body);
      });
    setSubmitConfirmOpen(false);
  };

  if (!exam || !exam.status || !submission) return null;

  return (
    <>
      <Divider sx={{ mb: 3, width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <Form onSubmit={handleSubmit(() => setSubmitConfirmOpen(true))} formState={formState} setError={setError}>
        <Stack
          spacing={3}
          divider={<Divider />}
          sx={{ '& .MuiFormLabel-root': { mb: 2, fontWeight: 600, color: 'text.primary', whiteSpace: 'pre-wrap' } }}
        >
          {submission.questions.map((question, i) => {
            const name = `answers.${i}.answer`;
            const formLabel = `${i + 1}. ${question.question} (${t('{{ point }} points', { point: question.weight })})`;

            return (
              <Box key={question.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {question.kind == 'single_selection' || question.kind == 'ox_selection' ? (
                  <SelectGroupControl
                    name={name}
                    formLabel={formLabel}
                    required={true}
                    control={control}
                    selections={question.selections || []}
                    helperText={question.help_text || null}
                    kind="radio"
                  />
                ) : exam.exam_kind == 'assignment' && question.kind == 'essay' ? (
                  <TextEditorControl
                    formLabel={formLabel}
                    name={name}
                    required={true}
                    control={control}
                    helperText={question.help_text || null}
                    minHeight="150px"
                    disableFormLabelFocus={true}
                    sx={{ my: 1 }}
                  />
                ) : (
                  <TextFieldControl
                    variant="outlined"
                    name={name}
                    formLabel={formLabel}
                    required={true}
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
      </Form>

      <>
        <BaseDialog
          open={submitConfirmOpen}
          setOpen={setSubmitConfirmOpen}
          title={exam.title}
          renderContent={() => (
            <DialogContentText component="div">
              <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                {formState.isSubmitting && <GradientCircularProgress sx={{ position: 'absolute' }} />}
                <Zoom
                  in={formState.isSubmitting}
                  style={{ position: 'absolute', top: '4em', transitionDelay: '500ms' }}
                  timeout={10}
                  unmountOnExit
                >
                  <Typography component="span" variant="caption" color="info.main">
                    {t('Submitting answers...')}
                  </Typography>
                </Zoom>
              </Box>

              {t('Are you sure you want to submit answers? If submitted, the exam will be finished.')}
              <br />
              {t('This action cannot be undone.')}
            </DialogContentText>
          )}
          actions={
            <Button size="large" onClick={confirmSubmitExam} autoFocus sx={{ position: 'relative' }}>
              {t('Submit')}
            </Button>
          }
        />
        <StopWatch examId={examId} getValues={getValues} />
      </>
    </>
  );
};

export default ExamForm;
