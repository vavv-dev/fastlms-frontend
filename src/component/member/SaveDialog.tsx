import { yupResolver } from '@hookform/resolvers/yup';
import { DeleteOutlined, Search } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  MemberDisplayResponse as DisplayResponse,
  RosterUpdateRequest,
  MemberUpdateRequest as UpdateRequest,
  memberCheckMember as checkMember,
  memberCreateMember as createMember,
  memberCreateRoster as createRoster,
  memberGetDisplays as getDisplays,
  memberUpdateMember as updateMember,
  memberUpdateRoster as updateRoster,
} from '@/api';
import { BaseDialog, Form, TextFieldControl as Text, updateInfiniteCache } from '@/component/common';
import { channelState, invitationUrl, userState } from '@/store';

interface ExtendedUpdateRequest extends UpdateRequest, RosterUpdateRequest {
  id?: string;
  username: string;
  name: string;
  email: string;
  channel_id: string;
  user_id: string;
  extra: Array<{ key: string; value: string }>;
}

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const schema: yup.ObjectSchema<ExtendedUpdateRequest> = yup.object({
    id: yup.string(),
    channel_id: yup.string().default(''),
    user_id: yup.string().default(''),
    memo: yup.string().default(''),
    data: yup.object().default({}),
    username: yup.string().required(REQUIRED).default(''),
    name: yup
      .string()
      .default('')
      .test('name', t('Name is required for inviting user.'), (value, context) => {
        const searchStatusCode = context.options.context?.searchStatusCode;
        return searchStatusCode === 404 && !value ? false : true;
      }),
    email: yup
      .string()
      .email(t("Email doesn't match email format"))
      .default('')
      .test('email', t('Email is required for inviting user.'), (value, context) => {
        const searchStatusCode = context.options.context?.searchStatusCode;
        return searchStatusCode === 404 && !value ? false : true;
      }),
    extra: yup
      .array()
      .of(yup.object({ key: yup.string().required(REQUIRED), value: yup.string().required(REQUIRED) }))
      .default([]),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: DisplayResponse;
}

export const SaveDialog = ({ open, setOpen, data: resource }: Props) => {
  const { t } = useTranslation('member');
  const user = useAtomValue(userState);
  const channel = useAtomValue(channelState);

  const [searchInput, setSearchInput] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [searchStatusCode, setSearchStatusCode] = useState(0);
  const [invite, setInvite] = useState(true);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, formState, reset, setValue, setError } = useForm<ExtendedUpdateRequest>({
    mode: 'onBlur',
    reValidateMode: 'onSubmit',
    resolver: yupResolver(schema),
    defaultValues: { ...schema.getDefault(), channel_id: channel?.id },
    context: { searchStatusCode },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'extra' });

  const extraSample = [
    { key: t('cellphone'), value: '010-1234-5678' },
    { key: t('job title'), value: t('software engineer') },
    { key: t('job position'), value: t('manager') },
  ];

  const saveMember = async ({ extra, ...member }: ExtendedUpdateRequest) => {
    const data = extra.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
    if (!member.id) {
      (searchStatusCode != 404
        ? createMember({ requestBody: { ...member, data } })
        : createRoster({ invitationUrl, invite, requestBody: { ...member, data } })
      )
        .then((created) => {
          setOpen(false);
          updateInfiniteCache<DisplayResponse>(getDisplays, created, 'create');
        })
        .catch((error) => setError('root.server', error));
    } else {
      const toUpdate = { id: member.id, requestBody: { ...member, data } };
      (searchStatusCode != 404 ? updateMember(toUpdate) : updateRoster(toUpdate))
        .then(() => {
          setOpen(false);
          const data = extra.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
          updateInfiniteCache<DisplayResponse>(getDisplays, { id: member.id, ...member, data }, 'update');
        })
        .catch((error) => setError('root.server', error));
    }
  };

  const searchUsername = () => {
    if (!searchInput) return;

    checkMember({ username: searchInput })
      .then((user) => {
        setSearchStatusCode(200);
        setValue('username', user.username, { shouldDirty: true, shouldValidate: true });
        setValue('user_id', user.id, { shouldDirty: true, shouldValidate: true });
        setSearchMessage(t('You can add this user to member.'));
      })
      .catch((e) => {
        setSearchStatusCode(e.status);
        if (e.status === 404) {
          setSearchMessage(t("User not found. If you provide the user's name and email, you can invite the user."));
          setValue('username', searchInput, { shouldDirty: true, shouldValidate: true });
        } else if (e.status === 409) {
          setSearchMessage(e.body.detail || e.message);
        } else {
          setError('root.server', e);
        }
      });
  };

  useEffect(() => {
    if (!resource) return;
    reset({
      ...resource,
      extra: Object.entries(resource.data || {}).map(([key, value]) => ({ key, value })),
    });
    setSearchStatusCode(resource.joined_at ? 200 : 404);
  }, [resource]); // eslint-disable-line

  if (!open || !user) return null;

  return (
    <BaseDialog
      isReady
      open={open}
      setOpen={setOpen}
      actions={
        <>
          {searchStatusCode == 404 && (
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={invite} onChange={(e) => setInvite(e.target.checked)} />}
                label={<Typography variant="body2">{t('Send invitation email')}</Typography>}
              />
            </FormGroup>
          )}
          <Button disabled={!formState.isDirty} onClick={() => reset()} color="primary">
            {t('Reset')}
          </Button>
          <Button disabled={!formState.isDirty || formState.isSubmitting} form="save-Member" type="submit" color="primary">
            {t('Save')}
          </Button>
        </>
      }
      maxWidth="sm"
      fullWidth
      renderContent={() => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {!resource && (
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
              <TextField
                autoFocus
                variant="standard"
                label={t('Search username')}
                placeholder={t('ex. johndoe')}
                value={searchInput}
                onChange={({ target }) => setSearchInput(target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button size="small" onClick={searchUsername} startIcon={<Search />}>
                          {t('Search')}
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
                onKeyUp={({ key }) => key === 'Enter' && searchUsername()}
                error={![0, 200, 404].includes(searchStatusCode)}
              />
              <Typography variant="body2" sx={{ color: ![0, 200, 404].includes(searchStatusCode) ? 'error.main' : 'inherit' }}>
                {searchMessage || t('Search username to check if this user is already a member.')}
              </Typography>
            </Box>
          )}

          {!!searchStatusCode && (
            <Form id="save-Member" onSubmit={handleSubmit(saveMember)} formState={formState} setError={setError}>
              <Grid container spacing={2}>
                {searchStatusCode == 404 && (
                  <Grid size={12} sx={{ display: 'flex', gap: 1 }}>
                    <Text
                      slotProps={{ inputLabel: { shrink: true } }}
                      name="name"
                      label={t('Fullname')}
                      placeholder={t('ex. John Doe')}
                      control={control}
                    />
                    <Text
                      slotProps={{ inputLabel: { shrink: true } }}
                      type="email"
                      name="email"
                      label={t('Email')}
                      placeholder={t('ex. johndoe@example.com')}
                      control={control}
                    />
                  </Grid>
                )}
                <Grid size={12}>
                  <Text
                    slotProps={{ inputLabel: { shrink: true } }}
                    name="memo"
                    label={t('Memo for this member.')}
                    placeholder={t('(Optional)')}
                    control={control}
                    multiline
                  />
                </Grid>

                <Grid size={12} sx={{ mt: 1 }}>
                  <Button startIcon={<AddIcon />} onClick={() => append({ key: '', value: '' })}>
                    {t('Add data field')}
                  </Button>
                  {fields.map((field, i) => (
                    <Box key={field.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Text
                        slotProps={{ inputLabel: { shrink: true } }}
                        name={`extra.${i}.key`}
                        required
                        placeholder={`ex. ${extraSample[i % extraSample.length]?.key}`}
                        control={control}
                      />
                      <Text
                        name={`extra.${i}.value`}
                        placeholder={`ex. ${extraSample[i % extraSample.length]?.value}`}
                        control={control}
                        required
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                      <IconButton onClick={() => remove(i)} sx={{ mt: 0.5 }}>
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Form>
          )}
        </Box>
      )}
    />
  );
};
