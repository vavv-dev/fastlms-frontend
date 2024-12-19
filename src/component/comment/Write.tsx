import { yupResolver } from '@hookform/resolvers/yup';
import { Close, InsertEmoticonOutlined } from '@mui/icons-material';
import { Avatar, Box, Button, IconButton, Rating, TextField, Typography, useTheme } from '@mui/material';
import type { EmojiClickData } from 'emoji-picker-react';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import {
  CommentDisplayResponse as DisplayResponse,
  PublicGetThreadData as GetThreadData,
  CommentResourceCreateRequest as ResourceCreateRequest,
  ThreadResponse,
  commentGetThreads,
  commentCreateResource as createResource,
  publicGetComments as getDisplays,
  publicGetThread as getThread,
  commentUpdateResource as updateResource,
} from '@/api';
import {
  EmojiPickerWrapper,
  Form,
  SelectControl as Select,
  TextEditorControl,
  updateInfiniteCache,
  useServiceImmutable,
} from '@/component/common';
import { userState } from '@/store';

interface Props {
  url: string;
  parent?: DisplayResponse;
  data?: DisplayResponse;
  onClose?: () => void;
  autoFocus?: boolean;
  question?: boolean;
  editor?: boolean;
  disableSelect?: boolean;
  ratingMode?: boolean;
}

const MAX_LENGTH = 2000;

const getPlainTextLength = (content: string) => {
  const div = document.createElement('div');
  div.innerHTML = content;
  return div.textContent?.length || 0;
};

const createSchema = (t: (key: string, data?: Record<string, string | number>) => string, ratingMode?: boolean) => {
  const schema: yup.ObjectSchema<ResourceCreateRequest> = yup.object({
    id: yup.string().nullable(),
    content: yup
      .string()
      .min(3, t('Content must be at least 3 characters long.'))
      .test(
        'content-length',
        ({ value }) => {
          const currentLength = getPlainTextLength(value || '');
          return t("Content can't be longer than {{ length }} characters. Current length is {{ current }}.", {
            length: MAX_LENGTH,
            current: currentLength,
          });
        },
        (value) => {
          if (!value) return true;
          const plainTextLength = getPlainTextLength(value);
          return plainTextLength <= MAX_LENGTH;
        },
      )
      .required(t('Content is required.'))
      .default(''),
    is_question: yup
      .boolean()
      .default(false)
      .transform((value) => (value ? true : false)),
    solved: yup.boolean().default(false),
    pinned: yup.boolean().default(false),
    rating: ratingMode
      ? yup.number().nullable().required(t('Rating is required.')).default(null)
      : yup.number().nullable().default(null),
    thread_id: yup.string().default(''),
    parent_id: yup.string().nullable().default(null),
    deleted: yup.boolean().default(false),
    receivers: yup.array(yup.string().required()).default([]),
  });

  return schema;
};

export const Write = ({ url, parent, data, onClose, autoFocus, question, editor, disableSelect, ratingMode }: Props) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const { data: thread, mutate: threadMutate } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, {
    url,
    ratingMode,
  });

  const schema = useMemo(() => createSchema(t, ratingMode), [t, ratingMode]);
  const { handleSubmit, control, setValue, trigger, getValues, formState, reset, setError } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...schema.getDefault(), is_question: question ? 'true' : 'false', thread_id: thread?.id },
  });

  useEffect(() => {
    if (!data || !data.content) return;
    reset({
      content: data.content,
      is_question: !!data.is_question,
      rating: data.rating || null,
    });
    trigger();
  }, [data?.content]); // eslint-disable-line

  const save = (input: ResourceCreateRequest) => {
    if (!user || !thread) return;

    // receivers: parent owner and sibling owner
    const receivers = [...(parent?.children?.map((child) => child.author.id) || [])].filter(
      (receiver) => receiver && receiver !== user.id,
    );
    if (parent && parent.author.id != user.id) receivers.push(parent.author.id);

    (data ? updateResource : createResource)({
      id: data?.id as string,
      requestBody: {
        ...input,
        parent_id: parent?.id,
        thread_id: thread.id as string,
        receivers,
      },
    })
      .then((updated) => {
        if (!data && parent?.id) {
          // fix cast Resource to DisplayResponse
          parent.children = [updated as DisplayResponse, ...(parent.children || [])];
          updateInfiniteCache<DisplayResponse>(getDisplays, parent, 'update');
        } else {
          if (!updated.thread_title) {
            updated.thread_title = thread.title;
          }
          updateInfiniteCache<DisplayResponse>(getDisplays, updated, data ? 'update' : 'create', 'children');
        }

        // update thread
        updateInfiniteCache<ThreadResponse>(
          commentGetThreads,
          data
            ? formState.dirtyFields['is_question']
              ? {
                  ...thread,
                  question_count: thread.question_count + (input.is_question ? 1 : -1),
                  unsolved_count: thread.unsolved_count + (input.is_question && !input.solved ? 1 : -1),
                }
              : thread
            : {
                ...thread,
                comment_count: thread.comment_count + 1,
                question_count: thread.question_count + (input.is_question ? 1 : 0),
                unsolved_count: thread.unsolved_count + (input.is_question && !input.solved ? 1 : 0),
              },
          'update',
        );

        reset();
        onClose?.();

        // update comment count locally
        threadMutate(
          (prev: ThreadResponse | undefined) => {
            if (!prev) return prev;
            return { ...prev, comment_count: (prev.comment_count || 0) + 1 };
          },
          { revalidate: false },
        );
      })
      .catch((error) => {
        setError('root.server', error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  const insertEmoji = (emojiData: EmojiClickData) => {
    setValue('content', `${getValues('content')}${emojiData.emoji}`, { shouldDirty: true });
    // RHF's setFocus doesn't work
    inputRef.current?.focus();
  };

  if (!user) return null;

  return (
    <Form onSubmit={handleSubmit(save)} formState={formState} setError={setError}>
      <Box
        className="comment-write"
        sx={{
          display: 'flex',
          gap: 1.4,
          alignItems: 'center',
          width: '100%',
          ...(editor && { alignItems: 'flex-start', '& .MuiAvatar-root': { mt: '16px' } }),
        }}
      >
        {!data && (
          <Avatar
            onClick={() => navigate(`/channel/${user.username}`)}
            src={user.thumbnail || ''}
            sx={{ width: 36, height: 36, '& img': { cursor: 'pointer' } }}
          />
        )}

        {editor ? (
          <Box sx={{ flexGrow: 1 }}>
            <TextEditorControl minHeight={100} name="content" control={control} margin="normal" />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {onClose ? (
                <Button onClick={onClose}>{t('Cancel')}</Button>
              ) : (
                <Button disabled={!formState.isDirty || formState.isSubmitting} onClick={() => reset()}>
                  {t('Reset')}
                </Button>
              )}
              <Button type="submit" disabled={!formState.isDirty || formState.isSubmitting}>
                {t('Save')}
              </Button>
            </Box>
          </Box>
        ) : (
          <Controller
            name="content"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                fullWidth
                autoFocus={autoFocus}
                placeholder={!data && !parent ? t('Write a comment here.') : undefined}
                variant="standard"
                multiline
                required
                error={!!error}
                slotProps={{
                  input: {
                    startAdornment: (
                      <>
                        {!disableSelect && (
                          <Select
                            disableUnderline
                            name="is_question"
                            margin="none"
                            variant="standard"
                            control={control}
                            options={[
                              { value: 'false', label: t('Comment') },
                              { value: 'true', label: t('Question') },
                            ]}
                            sx={{ width: '4em' }}
                          />
                        )}
                        <Box sx={{ position: 'relative' }}>
                          <IconButton ref={emojiButtonRef} onClick={() => setShowPicker((prev) => !prev)}>
                            <InsertEmoticonOutlined />
                          </IconButton>
                          <EmojiPickerWrapper
                            insertEmoji={insertEmoji}
                            showPicker={showPicker}
                            setShowPicker={setShowPicker}
                            emojiButtonRef={emojiButtonRef}
                          />
                        </Box>
                      </>
                    ),
                    endAdornment: (
                      <>
                        {/* save comment */}
                        <Button
                          sx={{ whiteSpace: 'nowrap', minWidth: 0, px: { xs: 1, sm: 3 } }}
                          type="submit"
                          disabled={!formState.isDirty || formState.isSubmitting}
                        >
                          {t('Save')}
                        </Button>

                        {/* cancel comment */}
                        {(data || parent) && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              reset();
                              onClose?.();
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        )}
                      </>
                    ),
                    inputProps: { maxLength: MAX_LENGTH },
                  },
                  inputLabel: { shrink: true },
                  formHelperText: { sx: { lineHeight: 1.2 } },
                }}
                helperText={error?.message ? error.message : ' '}
                sx={{
                  flexGrow: 1,
                  mt: 1,
                  '& .MuiFormControl-root': {
                    minWidth: '3.2em',
                    '& .MuiSelect-select ': { p: 0, fontSize: theme.typography.body2 },
                  },
                }}
                {...field}
                // fix cursor position
                onFocus={(e) => {
                  const len = e.currentTarget.value.length;
                  e.currentTarget.setSelectionRange(len, len);
                }}
                // set focus
                inputRef={inputRef}
                onKeyDown={() => setShowPicker(false)}
                onPaste={() => setValue('content', getValues('content'), { shouldDirty: true })}
              />
            )}
          />
        )}
      </Box>
      {ratingMode && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: '1em',
          }}
        >
          <Controller
            name="rating"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Rating
                precision={0.5}
                value={value}
                onChange={(_, newValue) => {
                  onChange(newValue ? Math.min(Math.max(newValue, 0), 5) : null);
                }}
              />
            )}
          />
          <Typography variant="caption" color={formState.errors.rating ? 'error' : 'textSecondary'}>
            {t('Please rate this content.')}
          </Typography>
        </Box>
      )}
    </Form>
  );
};
