import { yupResolver } from '@hookform/resolvers/yup';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Avatar, Box, Button, Container, Link, Typography } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import * as yup from 'yup';

import { accountProcessingState } from '.';

import { Body_PublicLogin, accountGetMe, publicLogin } from '@/api';
import { Form, TextFieldControl as Text } from '@/component/common';
import { loginExpireState, userState } from '@/store';

const createSchema = (t: (key: string) => string) => {
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

  return schema;
};

export const Login = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useAtom(userState);
  const setProcessing = useSetAtom(accountProcessingState);
  const setLoginExpire = useSetAtom(loginExpireState);
  const { mutate } = useSWRConfig();

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState, setValue } = useForm<Body_PublicLogin>({
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
        // clean previous cache
        await mutate(() => true, undefined, { revalidate: false });

        setLoginExpire(r.refresh_token_expire);
        const me = await accountGetMe();
        setUser(me);
      })
      .catch((error) => setError('root.server', error))
      .finally(() => setProcessing(false));
  };

  useEffect(() => {
    if (location.state?.username) {
      setValue('username', location.state.username);
      delete location.state.username;
    }
  }, [location.state?.username, setValue]);

  useEffect(() => {
    if (user) {
      const from = location.state?.from;
      if (from) {
        delete location.state.from;
        navigate(from, { state: location.state, replace: true });
      } else {
        navigate('/u', { state: location.state, replace: true });
      }
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
          <Text name="username" required label={t('Username')} control={control} />
          <Text name="password" required label={t('Password')} control={control} type="password" />
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/password-reset" component={RouterLink} underline="hover" variant="body2">
            {t('Forgot password?')}
          </Link>
          <Link to="/join" component={RouterLink} underline="hover" variant="body2">
            {t("Don't have an account? Join")}
          </Link>
        </Box>
      </Box>
    </Container>
  );
};
