import {
  CommentDisplayResponse as DisplayResponse,
  CommentGetThreadData as GetThreadData,
  CommentResourceCreateRequest as ResourceCreateRequest,
  ThreadResponse,
  commentGetThreads,
  commentCreateResource as createResource,
  commentGetDisplays as getDisplays,
  commentGetThread as getThread,
  commentUpdateResource as updateResource,
} from '@/api';
import { Form, SelectControl, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import i18next from '@/i18n';
import { userState } from '@/store';
import { modeState } from '@/theme';
import { yupResolver } from '@hookform/resolvers/yup';
import { Close, InsertEmoticonOutlined } from '@mui/icons-material';
import { Avatar, Box, Button, ClickAwayListener, IconButton, TextField, useTheme } from '@mui/material';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

interface Props {
  url: string;
  parent?: DisplayResponse;
  data?: DisplayResponse;
  onClose?: () => void;
  autoFocus?: boolean;
  question?: boolean;
}

const t = (key: string) => i18next.t(key, { ns: 'comment' });

const schema: yup.ObjectSchema<ResourceCreateRequest> = yup.object({
  id: yup.string().nullable(),
  content: yup
    .string()
    .min(3, t('Content must be at least 3 characters long.'))
    .max(500, t("Content can't be longer than 500 characters."))
    .required(t('Content is required.'))
    .default(''),
  is_question: yup
    .boolean()
    .default(false)
    .transform((value) => (value ? true : false)),
  solved: yup.boolean().default(false),
  pinned: yup.boolean().default(false),
  thread_id: yup.string().default(''),
  parent_id: yup.string().nullable().default(null),
  deleted: yup.boolean().default(false),
});

export const Write = ({ url, parent, data, onClose, autoFocus, question }: Props) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const navigate = useNavigate();
  const mode = useAtomValue(modeState);
  const user = useAtomValue(userState);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: thread, mutate: threadMutate } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, {
    url,
  });

  const { handleSubmit, control, setValue, trigger, getValues, formState, reset, setError } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...schema.getDefault(), is_question: question ? 'true' : 'false', thread_id: thread?.id },
  });

  useEffect(() => {
    if (!data || !data.content) return;
    reset({ content: data.content, is_question: !!data.is_question });
    trigger();
  }, [data?.content]); // eslint-disable-line

  const save = (input: ResourceCreateRequest) => {
    if (!thread) return;

    (data ? updateResource : createResource)({
      id: data?.id as string,
      requestBody: {
        ...input,
        parent_id: parent?.id,
        thread_id: thread.id as string,
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
            updated.thread_url = thread.url;
            updated.thread_resource_kind = thread.resource_kind;
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
      <Box sx={{ display: 'flex', gap: 1.4, alignItems: 'center', width: '100%' }}>
        {!data && (
          <Avatar
            onClick={() => navigate(`/channel/${user.username}`)}
            src={user.thumbnail || ''}
            sx={{ width: 36, height: 36, '& img': { cursor: 'pointer' } }}
          />
        )}
        <Controller
          name="content"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              fullWidth
              autoFocus={autoFocus}
              placeholder={!data && !parent ? t('Write a comment or question.') : undefined}
              variant="standard"
              multiline
              required
              error={!!error}
              slotProps={{
                input: {
                  startAdornment: (
                    <>
                      <SelectControl
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
                      <ClickAwayListener onClickAway={() => showPicker && setShowPicker(false)}>
                        <span>
                          <IconButton onClick={() => setShowPicker((prev) => !prev)}>
                            <InsertEmoticonOutlined />
                          </IconButton>
                          {showPicker && (
                            <Box
                              onKeyDown={(e) => e.stopPropagation()}
                              sx={{ position: 'absolute', left: 0, top: 'calc(100% + 4px)', zIndex: 10 }}
                            >
                              <EmojiPicker
                                theme={mode as Theme}
                                searchDisabled={false}
                                lazyLoadEmojis={true}
                                onEmojiClick={insertEmoji}
                                previewConfig={{ showPreview: false }}
                              />
                            </Box>
                          )}
                        </span>
                      </ClickAwayListener>
                    </>
                  ),
                  endAdornment: (
                    <>
                      {/* save comment */}
                      <Button
                        sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 3 }}
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
                  inputProps: { maxLength: 500 },
                },
                inputLabel: { shrink: true },
                formHelperText: { sx: { lineHeight: 1.2, mt: 0 } },
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
      </Box>
    </Form>
  );
};
