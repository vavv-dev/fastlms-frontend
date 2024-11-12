import { yupResolver } from '@hookform/resolvers/yup';
import { Refresh } from '@mui/icons-material';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
    description: yup.string().default(''),
    use_channel: yup.boolean(),
    thumbnail: yup.mixed(),
    banner: yup.mixed(),
  });

  return schema;
};

export const UserProfile = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
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
      description: user?.description || '',
      use_channel: user?.use_channel || false,
    });
  }, [user, reset]);

  const updateProfile = ({ name, email, description, use_channel }: UserUpdateRequest) => {
    setSnackbarMessage(null);
    accountUpdateMe({ requestBody: { name, email, description, use_channel } })
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
            slotProps={{ inputLabel: { shrink: true } }}
            name="description"
            label={t('Description')}
            control={control}
            margin="normal"
            placeholder={t('Enter a short description about yourself.')}
            multiline
          />

          <Button
            onClick={() => navigate('/password-reset')}
            sx={{ display: 'flex', alignItems: 'center', my: 1, cursor: 'pointer' }}
            startIcon={<VpnKeyOutlined />}
          >
            {t('Change password')}
          </Button>

          <Checkbox
            name="use_channel"
            label={t('Use channel')}
            control={control}
            margin="normal"
            helperText={t('If you enable this option, you can use the channel feature.')}
          />

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
