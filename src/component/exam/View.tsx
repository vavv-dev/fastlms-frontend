import { yupResolver } from '@hookform/resolvers/yup';
import { Check, KeyboardArrowRight, NotificationsActiveOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Typography, Zoom, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { examMessageState } from '.';
import { Form } from './Form';
import { Result } from './Result';

import {
  ExamAssessReadyRequest as AssessReadyRequest,
  ExamAssessResponse as AssessResponse,
  ExamDisplayResponse as DisplayResponse,
  ExamGetAssessData as GetAssessData,
  examGetAssess as getAssess,
  examGetDisplays as getDisplays,
  examReadyAssess as readyAssess,
} from '@/api';
import {
  CheckboxControl as Checkbox,
  Form as CommonForm,
  GradientCircularProgress,
  updateInfiniteCache,
  useServiceImmutable,
} from '@/component/common';
import { formatYYYMMDD } from '@/helper/util';

const createSchema = (t: (key: string) => string) => {
  const schema: yup.ObjectSchema<AssessReadyRequest> = yup.object({
    agreed: yup.boolean().oneOf([true], t('You must agree to the guidelines to start the exam.')).default(false),
    verification_required: yup.boolean().default(false),
    verification_code: yup.string().when('verification_required', {
      is: true,
      then: (schema) => schema.required(t('You must verify your identity to start the exam.')),
    }),
  });

  return schema;
};

export const View = ({ id }: { id: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const [verificationCode, setVerificationCode] = useState<string>('');
  const { data, mutate, isLoading, isValidating } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id });
  const examMessage = useAtomValue(examMessageState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { formState, handleSubmit, control, setValue, setError, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const ready = async (input: AssessReadyRequest) => {
    if (!data) return;
    await readyAssess({
      id: data.id,
      requestBody: input,
    })
      .then(async (updated) => {
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
        await mutate(updated, { revalidate: false });
      })
      .catch((error) => setError('root.server', error));
  };

  const verifyIdentity = () => {
    // TODO
    setVerificationCode('1234');
    setValue('verification_code', '1234', { shouldDirty: true, shouldValidate: true });
  };

  // prettier-ignore
  const GUIDELINES = [
    t('If someone else takes the exam on behalf of the test taker or takes the exam by proxy, the test results may be invalidated, resulting in disadvantages.'),
    t('If someone copies answers from others or provides answers to others, the test results may be invalidated, resulting in disadvantages.'),
    t('Using dishonest methods during the exam may invalidate the test results and result in disadvantages.'),
  ];

  useEffect(() => {
    if (!data) return;
    reset({
      agreed: false,
      verification_required: data.verification_required,
      verification_code: '',
    });
    // Do not remove this line.
    void formState.isValid;
  }, [data]); // eslint-disable-line

  if (!open || !data) return null;

  if (isLoading || isValidating) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <GradientCircularProgress />
      </Box>
    );
  }

  if (['ready', 'in_progress', 'timeout', 'failed', 'passed'].includes(data.status as string)) {
    const inProgress = data?.status == 'ready' || data?.status == 'in_progress';

    return (
      <ExamPaper maxWidth="mdl">
        <Typography variant="h5" sx={{ py: 1, mb: 3, fontWeight: 700, textAlign: 'center' }}>
          {data.title}
        </Typography>
        {inProgress ? <Form id={id} /> : <Result id={id} />}
      </ExamPaper>
    );
  }

  if (data.status === 'grading') {
    return (
      <ExamPaper>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
          <NotificationsActiveOutlined color="primary" fontSize="large" />
          <Typography variant="subtitle1">
            {t('Grading is in progress. When the grading is completed, you will be notified.')}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {t('Grading will be completed around 7 days after the exam ended.')}
            {data.end_date && t('The end date is {{ date }}.', { date: formatYYYMMDD(data.end_date) })}
          </Typography>
        </Box>
      </ExamPaper>
    );
  }

  if (examMessage) {
    return (
      <ExamPaper>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            {t('Another exam is in progress.')}
          </Typography>
          <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
            {t('Please complete the exam in progress before starting a new exam.')}
          </Typography>
          <Button size="large">{examMessage}</Button>
        </Box>
      </ExamPaper>
    );
  }

  return (
    <ExamPaper>
      <CommonForm onSubmit={handleSubmit(ready)} formState={formState} setError={setError}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            {t('Check the following guidelines to start the exam.')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Box
              component="ul"
              sx={{
                fontSize: theme.typography.body2.fontSize,
                bgcolor: 'action.hover',
                borderRadius: 1,
                py: '1em',
                wordBreak: 'keep-all',
                '& li + li': { pt: 1.6 },
              }}
            >
              {GUIDELINES.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </Box>
            <Checkbox
              sx={{ alignItems: 'center' }}
              control={control}
              name="agreed"
              label={t('I have read and agree to the above guidelines.')}
            />
          </Box>

          {data.verification_required && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                endIcon={<Check color={verificationCode ? 'success' : 'disabled'} />}
                onClick={verifyIdentity}
                size="large"
              >
                {t('Verify my identity.')}
              </Button>
              {formState.errors.verification_code && (
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  {formState.errors.verification_code.message?.toString()}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              type="submit"
              disabled={!formState.isDirty || formState.isSubmitting || !formState.isValid}
              endIcon={<KeyboardArrowRight />}
            >
              <Typography variant="h5">{t('Start exam taking')}</Typography>
            </Button>
            <Zoom
              in={formState.isSubmitting}
              style={{ position: 'absolute', right: 0, transitionDelay: '500ms' }}
              timeout={10}
              unmountOnExit
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('Entering the exam page...')}
              </Typography>
            </Zoom>
          </Box>
        </Box>
      </CommonForm>
    </ExamPaper>
  );
};

const ExamPaper = ({
  maxWidth,
  children,
}: {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'mdl' | false;
  children: React.ReactNode;
}) => {
  return (
    <Paper
      sx={{
        overflow: 'auto',
        borderRadius: 3,
        p: 3,
        my: 'auto',
        width: '100%',
        maxWidth: maxWidth || 'sm',
      }}
    >
      {children}
    </Paper>
  );
};
