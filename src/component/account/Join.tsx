import { UserCreateRequest, publicCreateUser } from '@/api';
import { CheckboxControl as Check, Form, TextFieldControl as Text } from '@/component/common';
import { alertState } from '@/component/layout';
import i18next from '@/i18n';
import { yupResolver } from '@hookform/resolvers/yup';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { Avatar, Box, Button, Container, Divider, Typography, useTheme } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'account' });

const REQUIRED_FIELD = t('This field is required.');

const schema: yup.ObjectSchema<UserCreateRequest> = yup.object({
  name: yup.string().required(REQUIRED_FIELD).default(''),
  username: yup.string().required(REQUIRED_FIELD).default(''),
  email: yup.string().email('Invalid email').required(REQUIRED_FIELD).default(''),
  password: yup.string().required(REQUIRED_FIELD).default(''),
  password2: yup
    .string()
    .required(REQUIRED_FIELD)
    .oneOf([yup.ref('password')], t("Passwords don't match."))
    .default(''),
  email_verification_url: yup.string().default(`${window.location.origin}/email-verification`),
  terms: yup.boolean().oneOf([true], REQUIRED_FIELD).default(false),
  privacy: yup.boolean().oneOf([true], REQUIRED_FIELD).default(false),
});

const Join = () => {
  const { t } = useTranslation('account');
  const theme = useTheme();
  const navigate = useNavigate();
  const setAlert = useSetAtom(alertState);

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
        navigate('/login');
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
          <BadgeOutlined />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ my: '.5em' }}>
          {t('Member Join')}
        </Typography>

        <Form onSubmit={handleSubmit(createAccount)} formState={formState} setError={setError}>
          <Text name="name" required label={t('Name')} control={control} />
          <Text name="username" required label={t('Username')} control={control} />
          <Text name="email" required label={t('Email')} control={control} />
          <Text name="password" required label={t('Password')} control={control} type="password" />
          <Text name="password2" required label={t('Retype Password')} control={control} type="password" />

          <Divider sx={{ my: 1, border: 'none' }} />

          <Check label={t('agree to Terms of Service')} name="terms" control={control} required>
            <Box sx={{ fontSize: theme.typography.body2, color: 'primary.main' }} component={Link} to={'/terms'}>
              {t('View content')}
            </Box>
          </Check>
          <Check label={t('agree to Privacy Policy')} name="privacy" control={control} required>
            <Box sx={{ fontSize: theme.typography.body2, color: 'primary.main' }} component={Link} to={'/privacy'}>
              {t('View content')}
            </Box>
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

        <Box sx={{ my: 3, fontSize: theme.typography.body2 }}>
          <Box onClick={() => navigate('/login')} sx={{ cursor: 'pointer' }}>
            {t('Already have an account? Login')}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Join;
