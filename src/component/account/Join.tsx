import { yupResolver } from '@hookform/resolvers/yup';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { Avatar, Box, Button, Container, Divider, Link, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { UserCreateRequest, publicCreateUser } from '@/api';
import { CheckboxControl as Check, Form, TextFieldControl as Text } from '@/component/common';
import { alertState } from '@/component/layout';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED_FIELD = t('This field is required.');
  const VALID_USERNAME = t('At least 4 characters with a mix of letters, numbers or underscore.');
  const VALID_PASSWORD = t('At least 8 characters with a mix of uppper letters, lower letters, numbers.');

  const schema: yup.ObjectSchema<UserCreateRequest> = yup.object({
    name: yup.string().required(REQUIRED_FIELD).default(''),
    username: yup
      .string()
      .required(REQUIRED_FIELD)
      .default('')
      .matches(/^\w{4,}$/, VALID_USERNAME),
    email: yup.string().email('Invalid email').required(REQUIRED_FIELD).default(''),
    password: yup
      .string()
      .required(REQUIRED_FIELD)
      .default('')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, VALID_PASSWORD),
    password2: yup
      .string()
      .required(REQUIRED_FIELD)
      .oneOf([yup.ref('password')], t("Passwords don't match."))
      .default(''),
    email_verification_url: yup.string().default(`${window.location.origin}/email-verification`),
    last_authed: yup.string(),
    terms: yup.boolean().oneOf([true], REQUIRED_FIELD).default(false),
    privacy: yup.boolean().oneOf([true], REQUIRED_FIELD).default(false),
  });

  return schema;
};

export const Join = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const setAlert = useSetAtom(alertState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState } = useForm<UserCreateRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const createAccount = (data: UserCreateRequest) => {
    publicCreateUser({ requestBody: data })
      .then(() => {
        // global alert
        setAlert({
          open: true,
          severity: 'success',
          message: t('{{ name }}, Check your email to verify your account. After verification, you can log in.', {
            name: data.name,
          }),
          duration: 10 * 1000,
        });
        navigate('/login', { state: { username: data.username } });
      })
      .catch((error) => setError('root.server', error));
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', '& form': { width: '100%' } }}>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <BadgeOutlined />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ my: '.5em' }}>
          {t('Member Join')}
        </Typography>

        <Form onSubmit={handleSubmit(createAccount)} formState={formState} setError={setError}>
          <Text name="name" required label={t('Name')} control={control} />
          <Text
            name="username"
            required
            label={t('Username')}
            control={control}
            helperText={t('At least 4 characters with a mix of letters, numbers or underscore.')}
          />
          <Text name="email" required label={t('Email')} control={control} />
          <Text
            name="password"
            required
            label={t('Password')}
            control={control}
            type="password"
            helperText={t('At least 8 characters with a mix of uppper letters, lower letters, numbers.')}
          />
          <Text name="password2" required label={t('Retype Password')} control={control} type="password" />

          <Divider sx={{ my: 1, border: 'none' }} />

          <Check label={t('agree to Terms of Service')} name="terms" control={control} required>
            <Link component={RouterLink} to="/terms" underline="hover" variant="body2">
              {t('View content')}
            </Link>
          </Check>
          <Check label={t('agree to Privacy Policy')} name="privacy" control={control} required>
            <Link component={RouterLink} to="/privacy" underline="hover" variant="body2">
              {t('View content')}
            </Link>
          </Check>

          <Button
            disabled={!formState.isDirty || formState.isSubmitting}
            size="large"
            sx={{ mt: 3 }}
            variant="contained"
            fullWidth
            type="submit"
          >
            {t('Join now')}
          </Button>
        </Form>

        <Link to="/login" component={RouterLink} underline="hover" sx={{ mt: 3 }} variant="body2">
          {t('Already have an account? Login')}
        </Link>
      </Box>
    </Container>
  );
};
