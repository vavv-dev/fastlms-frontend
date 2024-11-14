import { yupResolver } from '@hookform/resolvers/yup';
import { CheckBoxOutlineBlank, CheckBoxOutlined, ClearOutlined, Close, LibraryAddOutlined, Refresh } from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  ClickAwayListener,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const RESOURCE_OPTIONS = ['home', 'video', 'short', 'playlist', 'asset', 'quiz', 'survey', 'exam', 'lesson', 'course', 'qna'];
const MEMBER_FIELD_OPTIONS = ['birthdate', 'company', 'department', 'position'];
const MEMBER_FIELD_FIXED = ['username', 'name', 'email', 'cellphone'];

export const Setting: React.FC = () => {
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
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Form onSubmit={handleSubmit(updateChannel)} formState={formState} setError={setError}>
        <Box sx={{ mx: 'auto', maxWidth: 'md', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ my: 2 }}>
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
              <ReusableAutocomplete
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
              <ReusableAutocomplete
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
                backgroundColor: 'action.hover',
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

          <TextEditor
            minHeight={150}
            name="welcome"
            label={t('Channel home welcome message')}
            control={control}
            margin="normal"
          />

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
      </Form>

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
    </Box>
  );
};

interface ReusableAutocompleteProps {
  options: string[];
  fixedOptions?: string[];
  value: string[];
  onChange: (newValue: string[]) => void;
  label: string;
  placeholder: string;
  helperText?: string;
  freeSolo?: boolean;
}

const ReusableAutocomplete = ({
  options,
  fixedOptions = [],
  value,
  onChange,
  label,
  placeholder,
  helperText,
  freeSolo,
}: ReusableAutocompleteProps) => {
  const { t } = useTranslation('channel');
  const [open, setOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  const handleChange = (_: React.ChangeEvent<object>, newValue: string[]) => {
    const newValueWithoutFixed = newValue.filter((item) => !fixedOptions.includes(item));
    const sortedNewValue = newValueWithoutFixed.sort((a, b) => {
      const indexA = options.indexOf(a);
      const indexB = options.indexOf(b);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      } else if (indexA !== -1) {
        return -1;
      } else if (indexB !== -1) {
        return 1;
      } else {
        return newValueWithoutFixed.indexOf(a) - newValueWithoutFixed.indexOf(b);
      }
    });
    onChange([...fixedOptions, ...sortedNewValue]);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div ref={autocompleteRef}>
        <Autocomplete
          freeSolo={freeSolo}
          multiple
          open={open}
          onOpen={() => setOpen(true)}
          onClose={(_, reason) => {
            if (reason === 'selectOption') return;
            setOpen(false);
          }}
          options={options}
          disableCloseOnSelect
          renderInput={(params) => (
            <TextField
              variant="outlined"
              slotProps={{ inputLabel: { shrink: true } }}
              margin="normal"
              {...params}
              label={label}
              placeholder={placeholder}
              helperText={helperText}
            />
          )}
          onChange={handleChange}
          value={value}
          fullWidth
          renderOption={({ key, ...props }, option, { selected }) => (
            <li key={key} {...props}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBoxOutlined fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {t(option)}
            </li>
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                sx={{ borderRadius: 1, height: '2.2em' }}
                {...getTagProps({ index })}
                key={option}
                label={t(option)}
                disabled={fixedOptions.includes(option)}
              />
            ))
          }
          ListboxProps={{ sx: { '& li': { height: '2.2em' } } }}
          noOptionsText={t('No options')}
          sx={{ '& .MuiFormHelperText-root': { ml: 0, mt: 0.5 } }}
        />
      </div>
    </ClickAwayListener>
  );
};
