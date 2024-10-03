import {
  ChannelDisplayResponse,
  ChannelGetChannelByUsernameData,
  UserUpdateRequest,
  accountUpdateMe,
  channelGetChannelByUsername,
} from '@/api';
import { CheckboxControl, Form, TextFieldControl as Text, TextEditorControl, useServiceImmutable } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import i18next from '@/i18n';
import { userState } from '@/store';
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
  use_channel: yup.boolean(),
  thumbnail: yup.mixed(),
  banner: yup.mixed(),
});

export const Profile = () => {
  const { t } = useTranslation('u');
  const navigate = useNavigate();
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const [user, setUser] = useAtom(userState);

  // sync with channel user
  const { mutate } = useServiceImmutable<ChannelGetChannelByUsernameData, ChannelDisplayResponse>(channelGetChannelByUsername, {
    username: user?.use_channel ? user.username : '',
  });

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
        console.log(updated);
        if (user?.use_channel && mutate) mutate((prev) => prev && { ...prev, ...updated }, { revalidate: false });
      })
      .catch((error) => {
        if (error.body) {
          setError('root.server', error.body);
        }
      });
  };

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ mx: 'auto', maxWidth: 'md', display: 'flex', flexDirection: 'column' }}>
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

          <CheckboxControl
            name="use_channel"
            label={t('Use channel')}
            control={control}
            margin="normal"
            helperText={t('If you enable this option, you can use the channel feature.')}
          />

          <TextEditorControl minHeight={'200px'} name="description" label={t('Description')} control={control} margin="normal" />

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
        </Form>
      </Box>
    </Box>
  );
};
