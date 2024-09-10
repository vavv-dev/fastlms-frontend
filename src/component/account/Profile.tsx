import { UserUpdateRequest, accountUpdateMe } from '@/api';
import { Form, TextFieldControl as Text, TextEditorControl } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import i18next from '@/i18n';
import { homeUserState, userState } from '@/store';
import { yupResolver } from '@hookform/resolvers/yup';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Box, Button } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'account' });

const REQUIRED_FIELD = t('This field is required.');

const schema: yup.ObjectSchema<UserUpdateRequest> = yup.object({
  name: yup.string().required(REQUIRED_FIELD).default(''),
  username: yup.string(),
  email: yup.string().email(t('Invalid email')).required(REQUIRED_FIELD).default(''),
  description: yup.string().default(''),
  thumbnail: yup.mixed(),
  banner: yup.mixed(),
});

export const Profile = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const [user, setUser] = useAtom(userState);
  const [homeUser, setHomeUser] = useAtom(homeUserState);

  const { handleSubmit, control, setError, formState, reset } = useForm<UserUpdateRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  useEffect(() => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      description: user?.description || '',
    });
  }, [user, reset]);

  const updateProfile = ({ name, email, description }: UserUpdateRequest) => {
    setSnackbarMessage(null);
    accountUpdateMe({ requestBody: { name, email, description } })
      .then((user) => {
        setUser(user);
        if (user?.username === homeUser?.username) setHomeUser(user);
        setSnackbarMessage({ message: t('Profile information has been updated.'), duration: 3000 });
      })
      .catch((error) => {
        if (error.body) {
          setError('root.server', error.body);
        }
      });
  };

  const isOwner = user && user.username == homeUser?.username;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ mx: 'auto', mt: 5, maxWidth: 'md', display: 'flex', flexDirection: 'column' }}>
        <Form disabled={!isOwner} onSubmit={handleSubmit(updateProfile)} formState={formState} setError={setError}>
          <Text
            slotProps={{ inputLabel: { shrink: true } }}
            name="name"
            required
            label={t('Name')}
            control={control}
            margin="normal"
          />
          <Text
            slotProps={{ inputLabel: { shrink: true } }}
            name="email"
            required
            label={t('Email')}
            control={control}
            margin="normal"
          />
          <TextEditorControl
            minHeight={'200px'}
            disabled={!isOwner}
            name="description"
            label={t('Description')}
            control={control}
            margin="normal"
          />

          {isOwner && (
            <>
              <Button
                onClick={() => navigate('/password-reset')}
                sx={{ display: 'flex', alignItems: 'center', my: 1, cursor: 'pointer' }}
                startIcon={<VpnKeyOutlined />}
              >
                {t('Change password')}
              </Button>

              <Button
                disabled={!formState.isDirty || formState.isSubmitting}
                size="large"
                sx={{ mt: 3 }}
                variant="contained"
                fullWidth
                type="submit"
              >
                {t('Save profile information')}
              </Button>
            </>
          )}
        </Form>
      </Box>
    </Box>
  );
};
