import { yupResolver } from '@hookform/resolvers/yup';
import { KeyboardArrowRight, NotificationsActiveOutlined } from '@mui/icons-material';
import { Box, BoxProps, Button, Typography, Zoom, useTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import * as yup from 'yup';

import { ExamMessage } from '.';
import { Form } from './Form';
import { Result } from './Result';

import {
  ExamAttemptReadyRequest as AttemptReadyRequest,
  ExamAttemptResponse as AttemptResponse,
  ExamDisplayResponse as DisplayResponse,
  ExamsInprogressError,
  ExamGetAttemptData as GetAttemptData,
  examGetAttempt as getAttempt,
  examGetDisplays as getDisplays,
  examReadyAttempt as readyAttempt,
} from '@/api';
import { CheckboxControl as Checkbox, Form as CommonForm, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { courseResourceLocationState } from '@/component/course';
import { GlobalAlert, alertState } from '@/component/layout';
import { formatYYYMMDD } from '@/helper/util';

const createSchema = (t: (key: string) => string) => {
  const contextScheme = yup.object({
    course_id: yup.string().required(),
    lesson_id: yup.string().required(),
  });

  const schema: yup.ObjectSchema<AttemptReadyRequest> = yup.object({
    agreed: yup.boolean().oneOf([true], t('You must agree to the guidelines to start the exam.')).default(false),
    context: contextScheme.nullable().default(null),
  });

  return schema;
};

export const View = ({ id }: { id: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { pathname } = useLocation();
  const setAlert = useSetAtom(alertState);
  const { data, error, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });

  // course context
  const resourceLocation = useAtomValue(courseResourceLocationState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { formState, handleSubmit, control, setError, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const ready = async (input: AttemptReadyRequest) => {
    if (!data) return;
    // set course context
    const match = pathname.match(/\/course\/([^/]+)\/player/);
    if (match && resourceLocation && resourceLocation.resource_id === data.id) {
      input.context = {
        course_id: match[1],
        lesson_id: resourceLocation.lesson_id,
      };
    }

    await readyAttempt({
      id: data.id,
      requestBody: input,
    })
      .then(async (updated) => {
        updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
        await mutate(updated, { revalidate: false });
      })
      .catch((error) => {
        if (error.status === 409) {
          (error.body.detail as ExamsInprogressError).exams_in_progress.forEach((exam) => {
            setAlert({
              open: true,
              message: <ExamMessage key={exam.id} {...exam} />,
              severity: 'warning',
              duration: exam.remains * 1000,
            });
          });
        }
      });
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
    });
    // Do not remove this line.
    void formState.isValid;
  }, [data]); // eslint-disable-line

  if (error?.status === 409) {
    return (
      <ExamPaper sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ textAlign: 'center' }}>
          {t('Another exam is in progress.')}
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
          {t('Please complete the exam in progress before starting a new exam.')}
        </Typography>
        <GlobalAlert variant="outlined" onClose={undefined} />
      </ExamPaper>
    );
  }

  if (!open || !data) return null;

  if (['ready', 'in_progress', 'timeout', 'failed', 'passed'].includes(data.status as string)) {
    const inProgress = data?.status == 'ready' || data?.status == 'in_progress';

    return (
      <ExamPaper>
        <Typography variant="h5" sx={{ py: 1, mb: 3, fontWeight: 700, textAlign: 'center' }}>
          {data.title}
        </Typography>
        {inProgress ? <Form id={id} /> : <Result id={id} />}
      </ExamPaper>
    );
  }

  if (data.status === 'grading') {
    return (
      <ExamPaper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <NotificationsActiveOutlined color="primary" fontSize="large" />
        <Typography variant="subtitle1">
          {t('Grading is in progress. When the grading is completed, you will be notified.')}
        </Typography>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {t('Grading will be completed around 7 days after the exam ended.')}
          {data.end_date && t('The end date is {{ date }}.', { date: formatYYYMMDD(data.end_date) })}
        </Typography>
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
                py: '1em',
                wordBreak: 'keep-all',
                '& li + li': { pt: 1.6 },
                pr: 2,
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

interface ExamPaperProps {
  children: React.ReactNode;
  sx?: BoxProps['sx'];
  props?: BoxProps;
}

const ExamPaper = ({ children, sx, ...props }: ExamPaperProps) => {
  return (
    <Box className="exam-paper" {...props} sx={{ ...sx, p: { xs: 2, sm: 3, md: 5 }, width: '100%', maxWidth: 'mdl' }}>
      {children}
    </Box>
  );
};
