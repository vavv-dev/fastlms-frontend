import { PasswordResetRequest, publicPasswordReset, } from '@/api';
import { Form, TextFieldControl } from '@/component/common';
import i18next from '@/i18n';
import { userState } from '@/store';
import { yupResolver } from '@hookform/resolvers/yup';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Alert, Avatar, Box, Button, Collapse, Container, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'account' });

const schema: yup.ObjectSchema<PasswordResetRequest> = yup.object({
  email: yup.string().email(t('Invalid email')).required(t('This field is required.')).default(''),
  confirm_url: yup.string().default(`${window.location.origin}/password-reset-confirm`),
});

const PasswordReset = () => {
  const { t } = useTranslation('account');
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const [specialAlert, setSpecialAlert] = useState('');

  const { handleSubmit, control, setError, formState } = useForm<PasswordResetRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const resetPassword = (data: PasswordResetRequest) => {
    setSpecialAlert('');
    publicPasswordReset({
      requestBody: data,
    })
      .then(() => {
        setSpecialAlert(t('Password reset email has been sent. Follow the instructions in the email to reset your password.'));
      })
      .catch((error) => {
        if (error.body) {
          setError('root.server', error.body);
        }
      });
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', '& form': { width: '100%' } }}>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <VpnKeyOutlined />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ my: '.5em' }}>
          {t('Password reset')}
        </Typography>

        <Form onSubmit={handleSubmit(resetPassword)} formState={formState} setError={setError}>
          <Collapse in={!!specialAlert}>
            <Alert severity="success" sx={{ mb: 2 }} onClick={() => setSpecialAlert('')}>
              {specialAlert}
            </Alert>
          </Collapse>

          <Typography variant="body2" sx={{ my: '1em' }}>
            {t('Enter your email address to request a password reset. You will receive an email with instructions.')}
          </Typography>

          <TextFieldControl name="email" required label={t('Email')} control={control} />

          <Button
            disabled={!formState.isDirty || formState.isSubmitting}
            size="large"
            sx={{ mt: 3 }}
            variant="contained"
            fullWidth
            type="submit"
          >
            {t('Request password reset')}
          </Button>
        </Form>

        {!user && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', width: '100%', fontSize: theme.typography.body2 }}>
            <Box onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>
              {t('Login now')}
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PasswordReset;
