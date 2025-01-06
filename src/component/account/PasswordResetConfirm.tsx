import { yupResolver } from '@hookform/resolvers/yup';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Avatar, Box, Button, Container, Link, Typography } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import * as yup from 'yup';

import { PasswordResetConfirmRequest, publicPasswordResetConfirm } from '@/api';
import { Form, TextFieldControl as Text } from '@/component/common';
import { alertState } from '@/component/layout';
import { userState } from '@/store';

interface PasswordResetConfirmRequest2 extends PasswordResetConfirmRequest {
  new_password2?: string;
}

const createSchema = (t: (key: string) => string) => {
  const VALID_PASSWORD = t('At least 8 characters with a mix of uppper letters, lower letters, numbers.');

  const schema: yup.ObjectSchema<PasswordResetConfirmRequest2> = yup.object({
    token: yup.string().required().default(''),
    new_password: yup
      .string()
      .required(t('This field is required.'))
      .default('')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, VALID_PASSWORD),
    // local field
    new_password2: yup
      .string()
      .required(t('This field is required.'))
      .oneOf([yup.ref('new_password')], t("Passwords don't match."))
      .default(''),
  });

  return schema;
};

export const PasswordResetConfirm = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const user = useAtomValue(userState);
  const setAlert = useSetAtom(alertState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState } = useForm<PasswordResetConfirmRequest>({
    resolver: yupResolver(schema),
    defaultValues: { ...schema.getDefault(), token: searchParams.get('token') || '' },
  });

  const confirmPasswordReset = (data: PasswordResetConfirmRequest2) => {
    delete data.new_password2;
    publicPasswordResetConfirm({
      requestBody: data,
    })
      .then(() => {
        setAlert({
          open: true,
          severity: 'success',
          message: t('Sucessfully password changed. You can login with new password.'),
        });
        navigate('/login');
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

        <Form onSubmit={handleSubmit(confirmPasswordReset)} formState={formState} setError={setError}>
          <Typography variant="body2" sx={{ my: '1em' }}>
            {t('Enter your new password.')}
          </Typography>

          <Text
            name="new_password"
            required
            label={t('New password')}
            control={control}
            type="password"
            helperText={t('At least 8 characters with a mix of uppper letters, lower letters, numbers.')}
          />
          <Text name="new_password2" required label={t('Retype Password')} control={control} type="password" />

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
