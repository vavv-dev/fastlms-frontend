import { yupResolver } from '@hookform/resolvers/yup';
import { ClearOutlined, Close, LibraryAddOutlined, Refresh } from '@mui/icons-material';
import { Avatar, Box, Button, IconButton, Typography } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import {
  ChannelDisplayResponse as DisplayResponse,
  ChannelGetChannelByUsernameData as GetChannelByUsernameData,
  ResourceSchema,
  SharedResourceSelectorData as ResourceSelectorData,
  ChannelUpdateRequest as UpdateRequest,
  channelGetChannelByUsername as getChannelByUsername,
  sharedResourceSelector as resourceSelector,
  channelUpdateMyChannel as updateMyChannel,
} from '@/api';
import {
  AutocompleteSelect2,
  CheckboxAutocomplete,
  Form,
  TextFieldControl as Text,
  TextEditorControl as TextEditor,
  useServiceImmutable,
} from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const resourceSchema: yup.ObjectSchema<ResourceSchema> = yup.object({
    kind: yup.mixed<'video' | 'channel'>().default('video'),
    sub_kind: yup.string(),
    thumbnail: yup.string().default(''),
    id: yup.string().required(REQUIRED).label(t('ID')),
    title: yup.string().required(REQUIRED).default('').label(t('Title')),
    username: yup.string().required(REQUIRED),
  });

  const schema: yup.ObjectSchema<UpdateRequest> = yup.object({
    title: yup.string().required(REQUIRED).default(''),
    description: yup.string().required(REQUIRED).default(''),
    welcome: yup.string().default(''),
    active_resources: yup.array().of(yup.string().required(REQUIRED)).default([]),
    member_fields: yup.array().of(yup.string().required(REQUIRED)).default([]),
    thumbnail: yup.mixed(),
    banner: yup.mixed(),
    resources: yup.array().of(resourceSchema).default([]),
  });

  return schema;
};

export const ChannelInfo: React.FC = () => {
  const { t } = useTranslation('channel');
  const navigate = useNavigate();
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const user = useAtomValue(userState);
  const { data, mutate } = useServiceImmutable<GetChannelByUsernameData, DisplayResponse>(getChannelByUsername, {
    username: user?.username || '',
  });
  const [videoSelectorOpen, setVideoSelectorOpen] = useState(false);
  const [channelSelectorOpen, setChannelSelectorOpen] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, watch, control, setError, setValue, formState, reset } = useForm<UpdateRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const RESOURCE_OPTIONS = useMemo(
    () => [
      { label: t('Home'), value: 'home' },
      { label: t('Video'), value: 'video' },
      { label: t('Short'), value: 'short' },
      { label: t('Playlist'), value: 'playlist' },
      { label: t('Asset'), value: 'asset' },
      { label: t('Quiz'), value: 'quiz' },
      { label: t('Survey'), value: 'survey' },
      { label: t('Exam'), value: 'exam' },
      { label: t('Lesson'), value: 'lesson' },
      { label: t('Course'), value: 'course' },
      { label: t('Q&A'), value: 'qna' },
    ],
    [t],
  );

  const MEMBER_FIELD_OPTIONS = useMemo(
    () => [
      { label: t('Company'), value: 'company' },
      { label: t('Department'), value: 'department' },
      { label: t('Position'), value: 'position' },
    ],
    [t],
  );

  const MEMBER_FIELD_FIXED = useMemo(
    () => [
      { label: t('Username'), value: 'username' },
      { label: t('Name'), value: 'name' },
      { label: t('Email'), value: 'email' },
      { label: t('Cellphone'), value: 'cellphone' },
      { label: t('Birth Date'), value: 'birthdate' },
    ],
    [t],
  );

  useEffect(() => {
    if (!user || !data) return;
    reset({
      title: data.title,
      description: data.description,
      welcome: data.welcome,
      active_resources: data.active_resources,
      member_fields: data.member_fields,
      resources: data.resources,
    });
  }, [data, reset, user]);

  const updateChannel = (update: UpdateRequest) => {
    setSnackbarMessage(null);
    updateMyChannel({ requestBody: update })
      .then((updated) => {
        mutate((prev) => prev && { ...prev, ...updated }, { revalidate: false });
        setSnackbarMessage({ message: t('Channel information has been updated.'), duration: 3000 });
      })
      .catch((error) => setError('root.server', error));
  };

  const resources = watch('resources') || [];
  const welcomeVideo = resources.find((resource) => resource.kind === 'video');
  const relatedChannels = resources.filter((resource) => resource.kind === 'channel');

  if (!data) return null;

  return (
    <Form onSubmit={handleSubmit(updateChannel)} formState={formState} setError={setError}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ my: 1 }}>
          {t('Update your channel information.')}
        </Typography>
        <Text
          slotProps={{ inputLabel: { shrink: true } }}
          name="title"
          required
          label={t('Title')}
          control={control}
          margin="normal"
        />
        <Text
          slotProps={{ inputLabel: { shrink: true } }}
          name="description"
          required
          label={t('Description')}
          control={control}
          margin="normal"
          placeholder={t('Enter a short description about your channel.')}
          multiline
        />

        <Controller
          name="active_resources"
          control={control}
          render={({ field: { onChange, value } }) => (
            <CheckboxAutocomplete
              options={RESOURCE_OPTIONS}
              value={value || []}
              onChange={onChange}
              label={t('Active tabs')}
              placeholder={t('Select channel tabs to display.')}
            />
          )}
        />

        <Controller
          name="member_fields"
          control={control}
          render={({ field: { onChange, value } }) => (
            <CheckboxAutocomplete
              freeSolo
              options={MEMBER_FIELD_OPTIONS}
              fixedOptions={MEMBER_FIELD_FIXED}
              value={value || []}
              onChange={onChange}
              label={t('Member fields')}
              placeholder={t('Select or create member fields to display.')}
              helperText={t('To add a new field, enter the field name and press Enter.')}
            />
          )}
        />

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          <Box
            sx={{
              backgroundImage: `url(${welcomeVideo?.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: 100,
              aspectRatio: '16/9',
              borderRadius: 2,
              bgcolor: 'action.hover',
              my: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <Box>
            <IconButton onClick={() => setVideoSelectorOpen(true)}>
              <LibraryAddOutlined color="primary" />
            </IconButton>
            <IconButton
              onClick={() => {
                setValue('resources', [], { shouldDirty: true, shouldValidate: true });
              }}
            >
              <ClearOutlined color="error" />
            </IconButton>
            <Typography sx={{ display: 'block' }} variant="caption">
              {t('This video will be displayed on the channel home page.')}
            </Typography>
          </Box>
        </Box>

        <TextEditor minHeight={150} name="welcome" label={t('Channel home welcome message')} control={control} margin="normal" />

        <Box>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {t('Related channels which are displayed on the channel home page')}
            <IconButton onClick={() => setChannelSelectorOpen(true)}>
              <LibraryAddOutlined color="primary" />
            </IconButton>
          </Typography>

          <Box sx={{ display: 'flex', gap: 5, py: 2 }}>
            {relatedChannels.map((channel) => (
              <Box
                onClick={() => navigate(`/channel/${channel.username}`)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  cursor: 'pointer',
                  alignItems: 'center',
                  width: '100px',
                }}
                key={channel.id}
              >
                <Avatar src={channel.thumbnail} sx={{ width: 60, height: 60 }} />
                <Typography variant="subtitle2" sx={{ ...textEllipsisCss(2), lineHeight: 1.2, textAlign: 'center' }}>
                  {channel.title}
                </Typography>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue(
                      'resources',
                      resources.filter((resource) => resource.id !== channel.id),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                  size="small"
                  color="error"
                  sx={{ alignSelf: 'center' }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
          <IconButton onClick={() => reset()}>
            <Refresh />
          </IconButton>
          <Button disabled={!formState.isDirty || formState.isSubmitting} size="large" variant="contained" type="submit">
            {t('Save channel information')}
          </Button>
        </Box>
      </Box>

      {videoSelectorOpen && (
        <AutocompleteSelect2<ResourceSchema, ResourceSelectorData>
          service={resourceSelector}
          serviceParams={{ kinds: ['video'] }}
          labelField="title"
          open={videoSelectorOpen}
          setOpen={() => setVideoSelectorOpen(!videoSelectorOpen)}
          placeholder={`${t('Select channel welcome video')}`}
          onSelect={(selected) => {
            setValue('resources', [...resources.filter((resource) => resource.kind !== 'video'), ...selected], {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          excludes={new Set(welcomeVideo?.id)}
          selectionLimit={1}
        />
      )}

      {channelSelectorOpen && (
        <AutocompleteSelect2<ResourceSchema, ResourceSelectorData>
          service={resourceSelector}
          serviceParams={{ kinds: ['channel'] }}
          labelField="title"
          open={channelSelectorOpen}
          setOpen={() => setChannelSelectorOpen(!channelSelectorOpen)}
          placeholder={`${t('Select related channels')}`}
          onSelect={(selected) => {
            setValue('resources', [...resources, ...selected], {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          excludes={new Set(relatedChannels.map((channel) => channel.id))}
        />
      )}
    </Form>
  );
};
