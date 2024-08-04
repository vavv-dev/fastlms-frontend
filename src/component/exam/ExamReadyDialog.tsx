import { ExamAssessReadyRequest, ExamDisplayResponse, examGetDisplay, examReadyAssess } from '@/api';
import { BaseDialog, CheckboxControl, Form, GradientCircularProgress, updateInfiniteCache } from '@/component/common';
import i18next from '@/i18n';
import { yupResolver } from '@hookform/resolvers/yup';
import { Check, KeyboardArrowRight } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography, Zoom, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'exam' });

// prettier-ignore
const GUIDELINES = [
  t('If someone else takes the exam on behalf of the test taker or takes the exam by proxy, the test results may be invalidated, resulting in disadvantages.'),
  t('If someone copies answers from others or provides answers to others, the test results may be invalidated, resulting in disadvantages.'),
  t('Using dishonest methods during the exam may invalidate the test results and result in disadvantages.'),
];

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  exam: ExamDisplayResponse;
}

const readySchema: yup.ObjectSchema<ExamAssessReadyRequest> = yup.object({
  exam_id: yup.string().required().default(''),
  agreed: yup.boolean().oneOf([true], t('You must agree to the guidelines to start the exam.')).default(false),
  verification_required: yup.boolean().default(false),
  verification_code: yup.string().when('verification_required', {
    is: true,
    then: (schema) => schema.required(t('You must verify your identity to start the exam.')),
  }),
});

const ExamReadyDialog = ({ open, setOpen, exam }: Props) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState<string>('');
  const { formState, handleSubmit, control, setValue, setError } = useForm({
    resolver: yupResolver(readySchema),
    defaultValues: { ...readySchema.getDefault(), exam_id: exam.id, verification_required: exam.verification_required },
  });

  const readyExam = async (data: ExamAssessReadyRequest) => {
    await examReadyAssess({
      id: exam.id,
      requestBody: data,
    })
      .then(async (updated) => {
        updateInfiniteCache<ExamDisplayResponse>(examGetDisplay, updated, 'update');
        // Attention before starting the exam!!!
        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate(`/exam/${exam.id}/assess`);
      })
      .catch((error) => {
        setError('root.server', error.body);
      });
  };

  const verifyIdentity = () => {
    // TODO
    setVerificationCode('1234');
    setValue('verification_code', '1234', { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    void formState.isValid;
  }, [formState]);

  if (!exam) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={
        <Tooltip
          arrow
          title={
            exam.description && (
              <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                {exam.description}
              </Typography>
            )
          }
        >
          <span>{exam.title}</span>
        </Tooltip>
      }
      renderContent={() => (
        <Form onSubmit={handleSubmit(readyExam)} formState={formState} setError={setError}>
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
              <CheckboxControl
                sx={{ alignItems: 'center' }}
                control={control}
                name="agreed"
                label={t('I have read and agree to the above guidelines.')}
              />
            </Box>

            {exam.verification_required && (
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
              {formState.isSubmitting && <GradientCircularProgress sx={{ position: 'absolute' }} />}
              <Zoom
                in={formState.isSubmitting}
                style={{ position: 'absolute', right: 0, transitionDelay: '500ms' }}
                timeout={10}
                unmountOnExit
              >
                <Typography variant="caption" color="text.secondary">
                  {t('Entering the exam page...')}
                </Typography>
              </Zoom>
            </Box>
          </Box>
        </Form>
      )}
    />
  );
};

export default ExamReadyDialog;
