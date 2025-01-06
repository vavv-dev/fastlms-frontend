import { yupResolver } from '@hookform/resolvers/yup';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Alert, Avatar, Box, Button, Collapse, Container, Link, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import * as yup from 'yup';

import { PasswordResetRequest, publicPasswordReset } from '@/api';
import { Form, TextFieldControl as Text } from '@/component/common';
import { userState } from '@/store';

const createSchema = (t: (key: string) => string) => {
  const schema: yup.ObjectSchema<PasswordResetRequest> = yup.object({
    email: yup.string().email(t('Invalid email')).required(t('This field is required.')).default(''),
    confirm_url: yup.string().default(`${window.location.origin}/password-reset-confirm`),
  });

  return schema;
};

export const PasswordReset = () => {
  const { t } = useTranslation('account');
  const user = useAtomValue(userState);
  const [specialAlert, setSpecialAlert] = useState('');

  const schema = useMemo(() => createSchema(t), [t]);
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
      .catch((error) => setError('root.server', error));
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

          <Text name="email" required label={t('Email')} control={control} />

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
          <Link to="/login" component={RouterLink} underline="hover" sx={{ mt: 3 }} variant="body2">
            {t('Login now')}
          </Link>
        )}
      </Box>
    </Container>
  );
};
