import { ApiError, Body_PublicLogin, accountGetMe, publicLogin } from '@/api';
import { Form, TextFieldControl } from '@/component/common';
import i18next from '@/i18n';
import { accountProcessingState, loginExpireState, userState } from '@/store';
import { yupResolver } from '@hookform/resolvers/yup';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Avatar, Box, Button, Container, Typography, useTheme } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'account' });

const REQUIRED_FIELD = t('This field is required.');

const schema: yup.ObjectSchema<Body_PublicLogin> = yup.object({
  username: yup.string().required(REQUIRED_FIELD).default(''),
  password: yup.string().required(REQUIRED_FIELD).default(''),
  // currently not used
  grant_type: yup.string(),
  scope: yup.string(),
  client_id: yup.string(),
  client_secret: yup.string(),
});

export const Login = () => {
  const { t } = useTranslation('account');
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useAtom(userState);
  const setProcessing = useSetAtom(accountProcessingState);
  const setLoginExipire = useSetAtom(loginExpireState);

  const { handleSubmit, control, setError, formState } = useForm<Body_PublicLogin>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const login = ({ username, password }: Body_PublicLogin) => {
    // start auth processing
    setProcessing(true);

    publicLogin({
      formData: { username: username, password: password },
    })
      .then(async (r) => {
        setLoginExipire(r.refresh_token_expire);
        const me = await accountGetMe();
        setUser(me);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.body) {
          setError('root.server', error.body);
          setProcessing(false);
        }
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  useEffect(() => {
    if (user) {
      navigate(location.state?.from ? location.state.from : `/u/${user.username}`);
    }
  }, [user]); // eslint-disable-line

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', '& form': { width: '100%' } }}>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ my: '.5em' }}>
          {t('Login')}
        </Typography>

        <Form onSubmit={handleSubmit(login)} formState={formState} setError={setError}>
          <TextFieldControl name="username" required label={t('Username')} control={control} />
          <TextFieldControl name="password" required label={t('Password')} control={control} type="password" />
          <Button
            disabled={!formState.isDirty || formState.isSubmitting}
            size="large"
            sx={{ mt: 3 }}
            variant="contained"
            fullWidth
            type="submit"
          >
            {t('Login now')}
          </Button>
        </Form>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: theme.typography.body2 }}>
          <Box onClick={() => navigate('/password-reset')} sx={{ cursor: 'pointer' }}>
            {t('Forgot password?')}
          </Box>
          <Box onClick={() => navigate('/join')} sx={{ cursor: 'pointer' }}>
            {t("Don't have an account? Join")}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

