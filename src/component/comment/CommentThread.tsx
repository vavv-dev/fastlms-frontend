import { CommentGetThreadData, ThreadResponse, commentCreateThread, commentGetDisplay, commentGetThread } from '@/api';
import { InfiniteScrollIndicator, useInfinitePagination } from '@/component/common';
import { useServiceImmutable } from '@/component/common/hooks';
import { Box, Typography, useTheme } from '@mui/material';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICommentThreadProps } from '.';
import CommentBox from './CommentBox';
import WriteComment from './WriteComment';

const CommentThread = ({ question, sticky, ...threadData }: ICommentThreadProps) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    data: thread,
    mutate: threadMutate,
    error,
  } = useServiceImmutable<CommentGetThreadData, ThreadResponse>(commentGetThread, { url: threadData.url });
  const { data, isLoading, isValidating } = useInfinitePagination({
    apiOptions: { threadId: thread?.id },
    apiService: commentGetDisplay,
    infiniteScrollRef,
  });

  useEffect(() => {
    if (!error || error.status !== 404) return;
    commentCreateThread({
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
        <WriteComment url={threadData.url} question={question} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {data?.map((pagination) =>
          pagination.items?.map((comment) => <CommentBox url={threadData.url} key={comment.id} comment={comment} />),
        )}
      </Box>
      <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} />
    </Box>
  );
};

export default CommentThread;
