import {
  ChannelDisplayResponse as DisplayResponse,
  ChannelEmbedResource as EmbedResource,
  ChannelGetChannelByUsernameData as GetChannelByUsernameData,
  ChannelUpdateRequest as UpdateRequest,
  channelGetChannelByUsername as getChannelByUsername,
  channelUpdateMyChannel as updateMyChannel,
  videoVideoSelector as videoSelector,
} from '@/api';
import { AutocompleteSelect2, Form, TextFieldControl as Text, TextEditorControl, useServiceImmutable } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import i18next from '@/i18n';
import { userState } from '@/store';
import { yupResolver } from '@hookform/resolvers/yup';
import { CheckBoxOutlineBlank, CheckBoxOutlined, ClearOutlined, LibraryAddOutlined, Refresh } from '@mui/icons-material';
import { Autocomplete, Box, Button, Checkbox, Chip, ClickAwayListener, IconButton, TextField, Typography } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'channel' });

const REQUIRED = t('This field is required.');

const contentSchema: yup.ObjectSchema<EmbedResource> = yup.object({
  kind: yup.mixed<'video'>().default('video'),
  thumbnail: yup.string().default(''),
  id: yup.string().required(REQUIRED).label(t('ID')),
  title: yup.string().required(REQUIRED).default('').label(t('Title')),
});

const schema: yup.ObjectSchema<UpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default(''),
  description: yup.string().required(REQUIRED).default(''),
  welcome: yup.string().default(''),
  active_resources: yup.array().of(yup.string().required(REQUIRED)).default([]),
  member_fields: yup.array().of(yup.string().required(REQUIRED)).default([]),
  thumbnail: yup.mixed(),
  banner: yup.mixed(),
  resources: yup.array().max(1, t('Only one video is allowed')).of(contentSchema).label(t('Video')).default([]),
});

const RESOURCE_OPTIONS = ['home', 'video', 'short', 'playlist', 'asset', 'quiz', 'survey', 'exam', 'lesson', 'course'];
const MEMBER_FIELD_OPTIONS = ['birthdate', 'company', 'department', 'position'];
const MEMBER_FIELD_FIXED = ['username', 'name', 'email', 'cellphone'];

export const Setting: React.FC = () => {
  const { t } = useTranslation('channel');
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const user = useAtomValue(userState);
  const { data, mutate } = useServiceImmutable<GetChannelByUsernameData, DisplayResponse>(getChannelByUsername, {
    username: user?.username || '',
  });
  const [videoSelectorOpen, setVideoSelectorOpen] = useState(false);

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

  const resources = watch('resources');
  const welcomeVideo = resources?.[0];

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
                height: 150,
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

          <TextEditorControl
            minHeight={150}
            name="welcome"
            label={t('Channel home welcome message')}
            control={control}
            margin="normal"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
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
        <AutocompleteSelect2
          service={videoSelector}
          labelField="title"
          open={videoSelectorOpen}
          setOpen={() => setVideoSelectorOpen(!videoSelectorOpen)}
          placeholder={`${t('Select channel welcome video')}`}
          onSelect={(selected) => {
            setValue('resources', [...selected] as EmbedResource[], {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          excludes={new Set(welcomeVideo?.id)}
          selectionLimit={1}
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

const ReusableAutocomplete: React.FC<ReusableAutocompleteProps> = ({
  options,
  fixedOptions = [],
  value,
  onChange,
  label,
  placeholder,
  helperText,
  freeSolo,
}) => {
  const { t } = useTranslation('channel');
  const [open, setOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  const handleChange = (_: React.ChangeEvent<{}>, newValue: string[]) => {
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
