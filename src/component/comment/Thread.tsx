import { Refresh } from '@mui/icons-material';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ThreadProps } from '.';
import { Comment } from './Comment';
import { Write } from './Write';

import {
  PublicGetThreadData as GetThreadData,
  ThreadResponse,
  commentGetThreads,
  commentUpdateThread,
  commentCreateThread as createThread,
  publicGetComments as getDisplays,
  publicGetThread as getThread,
} from '@/api';
import {
  InfiniteScrollIndicator,
  SimpleSearch,
  updateInfiniteCache,
  useInfinitePagination,
  useServiceImmutable,
} from '@/component/common';
import { userState } from '@/store';

export const Thread = ({ question, sticky, refresh, ...threadProps }: ThreadProps) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const [search, setSearch] = useState<string>('');
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    data: thread,
    mutate: threadMutate,
    error,
  } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, {
    url: threadProps.url,
    ratingMode: threadProps.ratingMode,
  });

  const { data, isLoading, isValidating } = useInfinitePagination({
    apiService: getDisplays,
    apiOptions: { threadId: thread?.id, search, userId: user?.id },
    infiniteScrollRef,
  });

  // Create thread if not exists
  useEffect(() => {
    if (!error || error.status !== 404) return;
    createThread({
      requestBody: {
        ...threadProps,
        owner_id: threadProps.owner.id,
      },
    }).then((data) => threadMutate(data, { revalidate: false }));
  }, [error]); // eslint-disable-line

  // update thread info
  useEffect(() => {
    if (!thread) return;
    // only owner can update thread info
    if (thread.owner.username !== user?.username) return;
    if ((threadProps.thumbnail && thread.thumbnail !== threadProps.thumbnail) || threadProps.title !== thread.title) {
      commentUpdateThread({
        id: thread.id,
        requestBody: {
          title: threadProps.title,
          thumbnail: threadProps.thumbnail,
        },
      }).then(async () => {
        const updated = { ...thread, title: threadProps.title, thumbnail: threadProps.thumbnail };
        await threadMutate(updated, { revalidate: false });
        updateInfiniteCache<ThreadResponse>(commentGetThreads, updated, 'update');
      });
    }
  }, [thread, threadProps.title, threadProps.thumbnail, threadMutate, user]);

  if (!thread) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box
        className="comment-thread-header"
        sx={{
          bgcolor: theme.palette.background.paper,
          whiteSpace: 'nowrap',
          ...(sticky && { display: 'flex', flexDirection: 'column', gap: 1, position: 'sticky', top: 0, zIndex: 1, mb: 1 }),
        }}
      >
        {!threadProps.hideHeader && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Typography variant="h6">
              {question ? t('Question & Answer') : t('Comment')} {thread.comment_count || 0}
            </Typography>
            <SimpleSearch placeholder={t("Author'name or content")} search={search} setSearch={setSearch} />
            <Box sx={{ flexGrow: 1 }} />
          </Box>
        )}
        <Write
          url={threadProps.url}
          question={question}
          editor={threadProps.editor}
          disableSelect={threadProps.disableSelect}
          ratingMode={threadProps.ratingMode}
        />
      </Box>
      <Box className="comment-thread" sx={{ display: 'flex', flexDirection: 'column' }}>
        {data?.map((pagination) =>
          pagination.items?.map((comment) => (
            <Comment
              url={threadProps.url}
              key={comment.id}
              data={comment}
              resourceKind={threadProps.resource_kind}
              editor={threadProps.editor}
              disableSelect={threadProps.disableSelect}
              disableReply={threadProps.disableReply}
              ratingMode={threadProps.ratingMode}
            />
          )),
        )}
      </Box>
      {refresh && (
        <IconButton
          className="refresh-thread"
          color="primary"
          onClick={() => threadMutate()}
          sx={{ position: 'absolute', top: 0, right: 0 }}
        >
          <Refresh />
        </IconButton>
      )}
      <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
    </Box>
  );
};
