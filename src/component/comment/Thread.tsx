import {
  CommentGetThreadData as GetThreadData,
  ThreadResponse,
  commentCreateThread as createThread,
  commentGetDisplays as getDisplays,
  commentGetThread as getThread,
} from '@/api';
import { InfiniteScrollIndicator, useInfinitePagination } from '@/component/common';
import { useServiceImmutable } from '@/component/common/hooks';
import { Box, Typography, useTheme } from '@mui/material';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThreadProps } from '.';
import { Comment } from './Comment';
import { Write } from './Write';

export const Thread = ({ question, sticky, ...threadData }: ThreadProps) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    data: thread,
    mutate: threadMutate,
    error,
  } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, { url: threadData.url });
  const { data, isLoading, isValidating } = useInfinitePagination({
    apiOptions: { threadId: thread?.id },
    apiService: getDisplays,
    infiniteScrollRef,
  });

  useEffect(() => {
    if (!error || error.status !== 404) return;
    createThread({
      requestBody: {
        ...threadData,
        owner_id: threadData.owner.id,
      },
    }).then((data) => {
      threadMutate(data, { revalidate: false });
    });
  }, [error]); // eslint-disable-line

  if (!thread || !data) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          ...(sticky && { position: 'sticky', top: 0, zIndex: 1 }),
        }}
      >
        <Typography variant="h6">
          {question ? t('Question & Answer') : t('Comment')} {thread.comment_count || 0}
        </Typography>
        <Write url={threadData.url} question={question} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {data?.map((pagination) =>
          pagination.items?.map((comment) => <Comment url={threadData.url} key={comment.id} data={comment} />),
        )}
      </Box>
      <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
    </Box>
  );
};
