import { CommentDisplayResponse, commentGetDisplay, commentToggleAction, commentUpdateResource } from '@/api';
import { WithAvatar, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import {
  ArrowDropDown,
  ArrowDropUp,
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  Flag,
  PushPin,
  ThumbUp,
  ThumbUpOutlined,
} from '@mui/icons-material';
import { Box, Button, Chip, Collapse, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CommentActionMenu from './CommentActionMenu';
import WriteComment from './WriteComment';

interface Props {
  url: string;
  comment: CommentDisplayResponse;
  setParentHover?: (value: boolean) => void;
}

const CommentBox = ({ url, comment, setParentHover }: Props) => {
  const { t } = useTranslation('comment');
  const user = useAtomValue(userState);
  const [inEditing, setInEditing] = useState(false);
  const [inWriting, setInWrting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [hover, setHover] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const toggleAction = (action: 'like' | 'flag') => {
    if (!user) return;
    commentToggleAction({ id: comment.id, action }).then(() => {
      const update = { ...comment };
      switch (action) {
        case 'like':
          update.liked = !comment.liked;
          update.like_count = comment.like_count + (comment.liked ? -1 : 1);
          break;
        case 'flag':
          update.flagged = !comment.flagged;
          update.flag_count = comment.flag_count + (comment.flagged ? -1 : 1);
          break;
      }
      updateInfiniteCache<CommentDisplayResponse>(commentGetDisplay, update, 'update', 'children');
    });
  };

  const toggleSolved = () => {
    commentUpdateResource({
      id: comment.id,
      requestBody: { solved: !comment.solved },
    }).then(() => {
      updateInfiniteCache<CommentDisplayResponse>(
        commentGetDisplay,
        { ...comment, solved: !comment.solved },
        'update',
        'children',
      );
    });
  };

  useFixMouseLeave(boxRef, () => {
    setHover(false);
  });

  return (
    <Box
      ref={boxRef}
      sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', position: 'relative', pt: 2 }}
      onMouseEnter={() => {
        setHover(true);
        setParentHover && setParentHover(false);
      }}
      onMouseLeave={(e) => {
        if (e.relatedTarget === window) return;
        setHover(false);
        setParentHover && setParentHover(true);
      }}
    >
      <WithAvatar
        name={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {comment.author.name}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontSize: '.8em' }}>
              {t(...formatRelativeTime(comment.created))}
            </Typography>
          </Stack>
        }
        username={comment.author.username}
        thumbnail={comment.author.thumbnail || ''}
        variant={comment.parent_id ? 'small' : 'medium'}
      >
        <Box sx={{ flexGrow: 1, gap: 0.4, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mr: '2.5em' }}>
            {/* edit comment */}
            <Collapse in={inEditing} unmountOnExit>
              <WriteComment url={url} comment={comment} onClose={() => setInEditing(false)} autoFocus />
            </Collapse>

            {/* view content */}
            <Collapse in={!inEditing} unmountOnExit>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {comment.deleted ? t('Deleted') : comment.content}
              </Typography>
            </Collapse>
          </Box>

          {!comment.deleted && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gap: 1 }}>
              {/* pinned on top of thread */}
              {comment.pinned && (
                <Tooltip title={t('Pinned')} arrow>
                  <PushPin fontSize="small" color="info" />
                </Tooltip>
              )}

              {/* flag comment */}
              {!!comment.flag_count && (
                <Tooltip title={t('Flagged')} arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => toggleAction('flag')}>
                      <Flag fontSize="small" color="error" />
                    </IconButton>
                    {comment.flag_count.toLocaleString()}
                  </Box>
                </Tooltip>
              )}

              {/* like comment */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => toggleAction('like')}>
                  {comment.liked ? <ThumbUp fontSize="small" color="info" /> : <ThumbUpOutlined fontSize="small" />}
                </IconButton>
                {!!comment.like_count && comment.like_count.toLocaleString()}
              </Box>

              {/* allow only first level reply. limit replies to 30 */}
              {user && !comment.parent_id && (comment.children?.length || 0) < 30 && (
                <Button
                  onClick={() => {
                    setInEditing(false);
                    setInWrting((prev) => !prev);
                  }}
                  size="small"
                  sx={{ padding: '0 0.8em', minWidth: 0, minHeight: 0, borderRadius: '1em' }}
                >
                  {t('Reply')}
                </Button>
              )}

              {comment.is_question && (
                <Tooltip title={t('If question is solved, click to mark as solved')} arrow>
                  <Chip
                    {...(comment.solved
                      ? {
                          label: t('Question solved'),
                          icon: <CheckBoxOutlined />,
                          color: 'success',
                        }
                      : {
                          label: t('Question'),
                          icon: <CheckBoxOutlineBlankOutlined />,
                          color: 'warning',
                        })}
                    size="small"
                    sx={{ px: 0.5 }}
                    onClick={user?.username === comment.author.username ? () => toggleSolved() : undefined}
                  />
                </Tooltip>
              )}
            </Stack>
          )}

          {/* write reply */}
          {!comment.parent_id && (
            <Collapse in={inWriting} unmountOnExit>
              <WriteComment url={url} parent={comment} onClose={() => setInWrting(false)} autoFocus />
            </Collapse>
          )}

          {(comment.children?.length as number) > 0 && (
            <>
              <Button sx={{ py: 0, alignSelf: 'flex-start' }} onClick={() => setShowReplies((prev) => !prev)} size="small">
                {showReplies ? <ArrowDropUp /> : <ArrowDropDown />}
                {t('Replies')} {comment.children?.length.toLocaleString()}
              </Button>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {showReplies &&
                  comment.children?.map((child: CommentDisplayResponse) => (
                    <CommentBox url={url} key={child.id} comment={child} setParentHover={setHover} />
                  ))}
              </Box>
            </>
          )}
        </Box>
      </WithAvatar>

      {user && !comment.deleted && (
        <Box sx={{ visibility: !hover ? 'hidden' : 'visible', position: 'absolute', right: 0, top: '1em' }}>
          <CommentActionMenu
            url={url}
            comment={comment}
            onEdit={() => {
              setInWrting(false);
              setInEditing(true);
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default CommentBox;
