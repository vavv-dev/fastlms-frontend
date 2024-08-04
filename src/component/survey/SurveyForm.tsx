import { SurveyAssessResponse, SurveyGetAssessData, surveyGetAssess, surveySubmitAssess } from '@/api';
import { Form, SelectGroupControl, TextFieldControl, useServiceImmutable } from '@/component/common';
import { useScrollToFirstError } from '@/component/common/hooks';
import i18next from '@/i18n';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, Divider, Stack, Tooltip } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'survey' });

interface AnswerInput {
  answers: {
    id: number;
    answer: string;
  }[];
}

const surveySubmitSchema: yup.ObjectSchema<AnswerInput> = yup.object({
  answers: yup
    .array()
    .of(
      yup.object({
        id: yup.number().required(),
        mandatory: yup.boolean().required(),
        answer: yup
          .string()
          .when('mandatory', {
            is: true,
            then: (schema) => schema.required(t('This question is mandatory to answer.')),
            otherwise: (schema) => schema.notRequired(),
          })
          .default(''),
      }),
    )
    .required()
    .default([]),
});

const SurveyForm = ({ surveyId }: { surveyId: string }) => {
  const { t } = useTranslation('survey');
  const { data: survey, mutate } = useServiceImmutable<SurveyGetAssessData, SurveyAssessResponse>(surveyGetAssess, {
    id: surveyId,
  });

  const { handleSubmit, control, formState, setError, reset } = useForm<AnswerInput>({
    resolver: yupResolver(surveySubmitSchema),
    defaultValues: surveySubmitSchema.getDefault(),
  });

  // fix mui rhf ref issue
  useScrollToFirstError(formState.errors);

  useEffect(() => {
    if (!survey) return;
    reset({
      answers: survey.submission?.questions?.map(({ id, mandatory }) => ({
        id: id,
        mandatory,
        answer: '',
      })),
    });
  }, [survey]); // eslint-disable-line

  const submitSurvey = async (data: AnswerInput) => {
    surveySubmitAssess({
      id: surveyId,
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
      .then(async (updated) => {
        await mutate(updated, { revalidate: false });
      })
      .catch((error) => {
        if (error.body) setError('root.server', error.body);
      });
  };

  if (!survey || !survey.submission) return;

  return (
    <Form onSubmit={handleSubmit(submitSurvey)} formState={formState} setError={setError}>
      <Stack
        spacing={3}
        divider={<Divider />}
        sx={{ p: 2, width: '100%', '& .MuiFormLabel-root': { mb: 2, fontWeight: 500, color: 'text.primary' } }}
      >
        {survey.submission.questions?.map((question, i) => {
          const name = `answers.${i}.answer`;
          const labelText = `${i + 1}. ${!question.mandatory ? t('(Optional)') : ''} ${question.question}`;
          const formLabel = !question.mandatory ? (
            <Tooltip title={t('This question is optional. (You can skip this question)')} placement="top" arrow>
              <span>{labelText}</span>
            </Tooltip>
          ) : (
            labelText
          );

          return question.kind == 'single_selection' || question.kind == 'multiple_selection' ? (
            <SelectGroupControl
              key={question.id}
              name={name}
              formLabel={formLabel}
              required={question.mandatory}
              control={control}
              selections={question.selections || []}
              helperText={question.help_text || null}
              kind={question.kind == 'single_selection' ? 'radio' : 'checkbox'}
            />
          ) : (
            <TextFieldControl
              variant="outlined"
              key={question.id}
              name={name}
              formLabel={formLabel}
              required={question.mandatory}
              control={control}
              multiline={question.kind == 'text_input'}
              type={question.kind == 'number_input' ? 'number' : 'text'}
              helperText={question.help_text || null}
            />
          );
        })}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            fullWidth
            disabled={!formState.isDirty || formState.isSubmitting}
            type="submit"
            variant="contained"
            size="large"
          >
            {t('Submit')}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
};

export default SurveyForm;
