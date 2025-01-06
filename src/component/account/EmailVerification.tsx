import { yupResolver } from '@hookform/resolvers/yup';
import { LockOpenOutlined } from '@mui/icons-material';
import { Avatar, Box, Button, Container, Link, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import * as yup from 'yup';

import { ResendVerificationEmailRequest, publicResendVerificationEmail, publicVerifyEmail } from '@/api';
import { Form, TextFieldControl as Text } from '@/component/common';
import { alertState } from '@/component/layout';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED_FIELD = t('This field is required.');

  const schema: yup.ObjectSchema<ResendVerificationEmailRequest> = yup.object({
    email: yup.string().email('Invalid email').required(REQUIRED_FIELD).default(''),
    email_verification_url: yup.string().default(`${window.location.origin}/email-verification`),
  });

  return schema;
};

export const EmailVerification = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const setAlert = useSetAtom(alertState);
  const token = searchParams.get('token');
  const [invalidToken, setInvalidToken] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState } = useForm<ResendVerificationEmailRequest>({
    resolver: yupResolver(schema),
    defaultValues: { ...schema.getDefault(), token: searchParams.get('token') || '' },
  });

  const requestResend = (data: ResendVerificationEmailRequest) => {
    publicResendVerificationEmail({ requestBody: data })
      .then(() => {
        setAlert({
          open: true,
          severity: 'success',
          message: t('Check your email to verify your account. After verification, you can log in.'),
        });
      })
      .catch((error) => {
        setError('root.server', error);
        setInvalidToken(true);
      });
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      publicVerifyEmail({ token })
        .then(() => {
          setAlert({ open: true, severity: 'success', message: t('Sucessfully email verified and your account is activated.') });
          setTimeout(() => navigate('/login'), 1000);
        })
        .catch((error) => {
          if (error.body) {
            setAlert({ open: true, severity: 'error', message: error.body.detail });
          }
          setInvalidToken(true);
        });
    }
  }, [token, setAlert, navigate, t]);

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', '& form': { width: '100%' } }}>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <LockOpenOutlined />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ my: '.5em' }}>
          {t('Activate account')}
        </Typography>

        {invalidToken && (
          <Form onSubmit={handleSubmit(requestResend)} formState={formState} setError={setError}>
            <Typography variant="body2" sx={{ my: '1em' }}>
              {t('Enter your email which you used to join.')}
            </Typography>
            <Text name="email" required label={t('Email')} control={control} />
            <Button
              disabled={!formState.isDirty || formState.isSubmitting}
              size="large"
              sx={{ mt: 3 }}
              variant="contained"
              fullWidth
              type="submit"
            >
              {t('Request resend verification email')}
            </Button>
          </Form>
        )}

        <Link to="/login" component={RouterLink} underline="hover" sx={{ mt: 3 }} variant="body2">
          {t('Login now')}
        </Link>
      </Box>
    </Container>
  );
};
