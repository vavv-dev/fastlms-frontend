import { Refresh } from '@mui/icons-material';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ThreadProps } from '.';
import { Comment } from './Comment';
import { Write } from './Write';

import {
  CommentGetThreadData as GetThreadData,
  ThreadResponse,
  commentCreateThread as createThread,
  commentGetDisplays as getDisplays,
  commentGetThread as getThread,
} from '@/api';
import { InfiniteScrollIndicator, SimpleSearch, useInfinitePagination, useServiceImmutable } from '@/component/common';

export const Thread = ({ question, sticky, refresh, ...threadData }: ThreadProps) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const [search, setSearch] = useState<string>('');
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const { data: thread, mutate, error } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, { url: threadData.url });
  const { data, isLoading, isValidating } = useInfinitePagination({
    apiOptions: { threadId: thread?.id, search },
    apiService: getDisplays,
    infiniteScrollRef,
  });

  // Create thread if not exists
  useEffect(() => {
    if (!error || error.status !== 404) return;
    createThread({
      requestBody: {
        ...threadData,
        owner_id: threadData.owner.id,
      },
    }).then((data) => mutate(data, { revalidate: false }));
  }, [error]); // eslint-disable-line

  if (!thread) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box
        className="comment-thread-header"
        sx={{
          bgcolor: theme.palette.background.paper,
          ...(sticky && { display: 'flex', flexDirection: 'column', gap: 1, position: 'sticky', top: 0, zIndex: 1, mb: 1 }),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography variant="h6">
            {question ? t('Question & Answer') : t('Comment')} {thread.comment_count || 0}
          </Typography>
          <SimpleSearch placeholder={t("Author'name or content")} search={search} setSearch={setSearch} />
          <Box sx={{ flexGrow: 1 }} />
          {refresh && (
            <IconButton color="primary" onClick={() => mutate()}>
              <Refresh />
            </IconButton>
          )}
        </Box>
        <Write url={threadData.url} question={question} editor={threadData.editor} />
      </Box>
      <Box className="comment-thread" sx={{ display: 'flex', flexDirection: 'column' }}>
        {data?.map((pagination) =>
          pagination.items?.map((comment) => (
            <Comment
              url={threadData.url}
              key={comment.id}
              data={comment}
              resourceKind={threadData.resource_kind}
              editor={threadData.editor}
            />
          )),
        )}
      </Box>
      <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
    </Box>
  );
};
