import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, Close } from '@mui/icons-material';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  ChannelDisplayResponse as DisplayResponse,
  ChannelGetChannelByUsernameData as GetChannelByUsernameData,
  LearningResourceKind,
  ResourceSchema,
  SharedResourceSelectorData,
  UserMessageSchema,
  channelGetChannelByUsername as getChannelByUsername,
  messageSendMemberMessage,
  sharedResourceSelector,
} from '@/api';
import {
  AutocompleteSelect2,
  BaseDialog,
  Form,
  TextFieldControl as Text,
  WithAvatar,
  searchFamily,
  useServiceImmutable,
} from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { userState } from '@/store';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  selection: string[];
  totalSelected: boolean;
  total: number;
}

type UserMessageSchemaExt = UserMessageSchema & {
  caption: string;
  attachment: ResourceSchema | null;
};

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const schema: yup.ObjectSchema<UserMessageSchemaExt> = yup.object({
    title: yup.string().required(REQUIRED).default('').label(t('Message title')),
    kind: yup.string<LearningResourceKind>().default('channel'),
    object_title: yup.string().default(''),
    object_id: yup.string().default(''),
    // extra fields
    caption: yup
      .string()
      .required(REQUIRED)
      .default('')
      .label(t('Message caption'))
      .max(200, t('Message caption is too long. Max {{ max }} characters.')),
    attachment: yup.mixed<ResourceSchema>().nullable().default(null),
    parcel: yup.mixed(),
  });

  return schema;
};

export const MessageDialog = ({ open, setOpen, selection, totalSelected, total }: Props) => {
  const { t } = useTranslation('member');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const [resourceSelectorOpen, setResourceSelectorOpen] = useState(false);
  const { data } = useServiceImmutable<GetChannelByUsernameData, DisplayResponse>(getChannelByUsername, {
    username: user?.username || '',
  });
  const messageRef = useRef<HTMLDivElement>(null);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const search = useAtomValue(searchFamily('member'));

  const schema = useMemo(() => createSchema(t), [t]);
  const { watch, handleSubmit, control, setError, setValue, formState, reset } = useForm<UserMessageSchemaExt>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });
  const attachment = watch('attachment');

  const closeDialog = () => {
    setOpen(false);
  };

  const sendMessage = ({ title }: UserMessageSchema) => {
    messageSendMemberMessage({
      requestBody: {
        receivers: totalSelected ? undefined : selection,
        member_search: totalSelected ? search : undefined,
        user_message: {
          title,
          object_title: messageRef.current?.outerHTML || '',
          object_id: attachment?.id || user?.username || '',
          kind: attachment?.kind || 'channel',
        },
      },
    })
      .then(() => {
        setSnackbarMessage({
          message: t('Message sent to {{count}} member(s) successfully.', { count: totalSelected ? total : selection.length }),
          duration: 3000,
        });
        closeDialog();
      })
      .catch((error) => setError('root.server', error));
  };

  const messageTitle = watch('title');
  const messageCaption = watch('caption');

  const attachKinds = ['video', 'playlist', 'asset', 'quiz', 'survey', 'exam', 'lesson', 'course', 'channel'].filter((kind) =>
    data?.active_resources.includes(kind),
  );

  if (!user) return null;

  return (
    <BaseDialog
      isReady
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      renderContent={() => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption">{t('Receivers')}</Typography>
            <Typography variant="body2" color="primary">
              {t('{{count}} member(s) selected.', { count: totalSelected ? total : selection.length })}
            </Typography>
            <Typography variant="caption">
              {t('If member has not joined yet, they will receive this message when they join.')}
            </Typography>
          </Box>

          <Form id="user-message" onSubmit={handleSubmit(sendMessage)} formState={formState} setError={setError}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Text
                slotProps={{ inputLabel: { shrink: true } }}
                name="title"
                required
                label={t('Message title')}
                control={control}
                placeholder={t('Recommend new video')}
              />
              <Text
                slotProps={{ inputLabel: { shrink: true } }}
                name="caption"
                required
                label={t('Message caption')}
                control={control}
                multiline
                placeholder={t('This video is about ...')}
              />
            </Box>
          </Form>

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
            <Button onClick={() => setResourceSelectorOpen(true)} startIcon={<AddOutlined />}>
              {t('Attach resource to message')}
            </Button>
            {attachment && (
              <IconButton
                onClick={() =>
                  setValue('attachment', null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <Close color="error" />
              </IconButton>
            )}
          </Box>

          {resourceSelectorOpen && (
            <AutocompleteSelect2<ResourceSchema, SharedResourceSelectorData>
              service={sharedResourceSelector}
              serviceParams={{ kinds: attachKinds as ResourceSchema['kind'][] }}
              labelField="title"
              open={resourceSelectorOpen}
              setOpen={() => setResourceSelectorOpen(!resourceSelectorOpen)}
              placeholder={`${t('Select channel welcome video')}`}
              onSelect={(selected) =>
                setValue('attachment', selected[0], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              excludes={new Set(attachment ? [attachment.id] : [])}
              selectionLimit={1}
              groupField="kind"
            />
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption">{t('Preview message')}</Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                bgcolor: 'action.hover',
              }}
            >
              <WithAvatar {...user} variant="small">
                {messageTitle || t('Message title')}
              </WithAvatar>

              <Box ref={messageRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messageCaption && <Typography style={{ fontSize: '1rem' }}>{messageCaption}</Typography>}
                {attachment && (
                  <Box style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                    <Box
                      style={{
                        backgroundImage: `url(${attachment.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        height: '58px',
                        width: '100px',
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        border: attachment.thumbnail ? 'none' : `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem',
                      }}
                    >
                      {!attachment.thumbnail && t(attachment.kind)}
                    </Box>
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography style={{ fontSize: '0.875rem' }}>[{t(attachment.kind)}]</Typography>
                      <Typography
                        style={{
                          lineHeight: '1.2rem',
                          fontSize: '0.875rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {attachment.title}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      actions={
        <>
          <Button disabled={!formState.isDirty} onClick={() => reset()} color="primary">
            {t('Reset')}
          </Button>
          <Button disabled={!formState.isDirty || formState.isSubmitting} form="user-message" type="submit">
            {t('Send message')}
          </Button>
        </>
      }
    />
  );
};
