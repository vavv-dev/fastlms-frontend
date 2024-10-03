import {
  CommentDisplayResponse as DisplayResponse,
  commentGetDisplays as getDisplays,
  commentToggleAction as toggleAction,
  commentUpdateResource as updateResource,
} from '@/api';
import { WithAvatar, createToggleAction, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import {
  ArrowDropDown,
  ArrowDropUp,
  BookmarkBorderOutlined,
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
import { ActionMenu } from './ActionMenu';
import { Write } from './Write';

interface Props {
  url: string;
  data: DisplayResponse;
  setParentHover?: (value: boolean) => void;
}

const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays, true);

export const Comment = ({ url, data, setParentHover }: Props) => {
  const { t } = useTranslation('comment');
  const user = useAtomValue(userState);
  const [inEditing, setInEditing] = useState(false);
  const [inWriting, setInWrting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [hover, setHover] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const toggleSolved = () => {
    updateResource({
      id: data.id,
      requestBody: { solved: !data.solved },
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { ...data, solved: !data.solved }, 'update', 'children');
    });
  };

  useFixMouseLeave(boxRef, () => {
    setHover(false);
  });

  return (
    <Box
      ref={boxRef}
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        position: 'relative',
        pt: 2,
        '& .avatar-children': { flexShrink: 1, gap: 1 },
      }}
      onMouseEnter={() => {
        setHover(true);
        setParentHover?.(false);
      }}
      onMouseLeave={(e) => {
        if (e.relatedTarget === window) return;
        setHover(false);
        setParentHover?.(true);
      }}
    >
      <WithAvatar
        name={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {data.author.name}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontSize: '.8em' }}>
              {t(...formatRelativeTime(data.created))}
            </Typography>
            {data.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
          </Stack>
        }
        username={data.author.username}
        thumbnail={data.author.thumbnail || ''}
        variant={data.parent_id ? 'small' : 'medium'}
      >
        <Box sx={{ flexGrow: 1, gap: 0.4, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mr: '2.5em' }}>
            {/* edit comment */}
            <Collapse in={inEditing} unmountOnExit>
              <Write url={url} data={data} onClose={() => setInEditing(false)} autoFocus />
            </Collapse>

            {/* view content */}
            <Collapse in={!inEditing} unmountOnExit>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, display: 'block !important' }}>
                {data.deleted ? t('Deleted') : data.content}
              </Typography>
            </Collapse>
          </Box>

          {!data.deleted && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gap: 1 }}>
              {/* pinned on top of thread */}
              {data.pinned && (
                <Tooltip title={t('Pinned')} arrow>
                  <PushPin fontSize="small" color="info" />
                </Tooltip>
              )}

              {/* flag comment */}
              {!!data.flag_count && (
                <Tooltip title={t('Flagged')} arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => action('flag', data)}>
                      <Flag fontSize="small" color="error" />
                    </IconButton>
                    {data.flag_count.toLocaleString()}
                  </Box>
                </Tooltip>
              )}

              {/* like comment */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => action('like', data)}>
                  {data.liked ? <ThumbUp fontSize="small" color="info" /> : <ThumbUpOutlined fontSize="small" />}
                </IconButton>
                {!!data.like_count && data.like_count.toLocaleString()}
              </Box>

              {/* allow only first level reply. limit replies to 30 */}
              {user && !data.parent_id && (data.children?.length || 0) < 30 && (
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

              {data.is_question && (
                <Tooltip title={t('If question is solved, click to mark as solved')} arrow>
                  <Chip
                    {...(data.solved
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
                    onClick={user?.username === data.author.username ? () => toggleSolved() : undefined}
                  />
                </Tooltip>
              )}
            </Stack>
          )}

          {/* write reply */}
          {!data.parent_id && (
            <Collapse in={inWriting} unmountOnExit>
              <Write url={url} parent={data} onClose={() => setInWrting(false)} autoFocus />
            </Collapse>
          )}

          {(data.children?.length as number) > 0 && (
            <>
              <Button sx={{ py: 0, alignSelf: 'flex-start' }} onClick={() => setShowReplies((prev) => !prev)} size="small">
                {showReplies ? <ArrowDropDown /> : <ArrowDropUp />}
                {t('Replies')} {data.children?.length.toLocaleString()}
              </Button>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {showReplies &&
                  data.children?.map((child: DisplayResponse) => (
                    <Comment url={url} key={child.id} data={child} setParentHover={setHover} />
                  ))}
              </Box>
            </>
          )}
        </Box>
      </WithAvatar>

      {user && !data.deleted && (
        <Box sx={{ visibility: !hover ? 'hidden' : 'visible', position: 'absolute', right: 0, top: '1em' }}>
          <ActionMenu
            url={url}
            data={data}
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
