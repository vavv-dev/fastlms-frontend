import { yupResolver } from '@hookform/resolvers/yup';
import { Refresh } from '@mui/icons-material';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import * as yup from 'yup';

import { UserUpdateRequest, accountUpdateMe } from '@/api';
import { CheckboxControl as Checkbox, Form, TextFieldControl as Text } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { userState } from '@/store';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED_FIELD = t('This field is required.');

  const schema: yup.ObjectSchema<UserUpdateRequest> = yup.object({
    name: yup.string().required(REQUIRED_FIELD).default(''),
    username: yup.string(),
    email: yup.string().email(t('Invalid email')).required(REQUIRED_FIELD).default(''),
    birthdate: yup
      .string()
      .nullable()
      .transform((v) => v || null),
    description: yup.string().default(''),
    use_channel: yup.boolean(),
    thumbnail: yup.mixed(),
    last_authed: yup.string(),
    banner: yup.mixed(),
  });

  return schema;
};

export const UserProfile = () => {
  const { t } = useTranslation('account');
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const [user, setUser] = useAtom(userState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState, reset } = useForm<UserUpdateRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name || '',
      email: user.email || '',
      birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '',
      description: user.description || '',
      use_channel: user.use_channel || false,
    });
  }, [user, reset]);

  const updateProfile = (u: UserUpdateRequest) => {
    setSnackbarMessage(null);
    accountUpdateMe({ requestBody: u })
      .then((updated) => {
        setUser(updated);
        setSnackbarMessage({ message: t('Profile information has been updated.'), duration: 3000 });
      })
      .catch((error) => setError('root.server', error));
  };

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ mx: 'auto', maxWidth: 'sm', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2" sx={{ my: 2 }}>
          {t('Update your profile information.')}
        </Typography>
        <Form onSubmit={handleSubmit(updateProfile)} formState={formState} setError={setError}>
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
          <Text
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: new Date().toISOString().split('T')[0] },
            }}
            name="birthdate"
            label={t('Birthdate')}
            control={control}
            margin="normal"
            type="date"
            helperText={t('This field is optional. But required for some services like Course certificate.')}
          />
          <Text
            slotProps={{ inputLabel: { shrink: true } }}
            name="description"
            label={t('Description')}
            control={control}
            margin="normal"
            placeholder={t('Enter a short description about yourself.')}
            multiline
          />

          <Checkbox
            name="use_channel"
            label={t('Use channel')}
            control={control}
            margin="normal"
            helperText={t('If you enable this option, you can use the channel feature.')}
          />

          <Button
            component={RouterLink}
            to="/password-reset"
            sx={{ my: 3, algignSelf: 'flex-start' }}
            startIcon={<VpnKeyOutlined />}
          >
            {t('Change password')}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
            <IconButton onClick={() => reset()}>
              <Refresh />
            </IconButton>
            <Button disabled={!formState.isDirty || formState.isSubmitting} size="large" variant="contained" type="submit">
              {t('Save profile information')}
            </Button>
          </Box>
        </Form>
      </Box>
    </Box>
  );
};
