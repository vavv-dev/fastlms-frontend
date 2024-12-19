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
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  IconButton,
  Rating,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';
import { Write } from './Write';

import {
  CommentDisplayResponse as DisplayResponse,
  LearningResourceKind,
  ThreadResponse,
  commentGetThreads,
  publicGetComments as getDisplays,
  commentToggleAction as toggleAction,
  commentUpdateResource as updateResource,
} from '@/api';
import { WithAvatar, createToggleAction, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { durationToSeconds, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';

interface Props {
  url: string;
  data: DisplayResponse;
  resourceKind: LearningResourceKind;
  setParentHover?: (value: boolean) => void;
  editor?: boolean;
  disableSelect?: boolean;
  disableReply?: boolean;
  ratingMode?: boolean;
}

export const Comment = ({ url, data, resourceKind, setParentHover, editor, disableSelect, disableReply, ratingMode }: Props) => {
  const { t } = useTranslation('comment');
  const user = useAtomValue(userState);
  const [inEditing, setInEditing] = useState(false);
  const [inWriting, setInWrting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [hover, setHover] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays, true);

  const toggleSolved = () => {
    updateResource({
      id: data.id,
      requestBody: { solved: !data.solved },
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { ...data, solved: !data.solved }, 'update', 'children');
      // update thread
      updateInfiniteCache<ThreadResponse>(
        commentGetThreads,
        (thread) =>
          thread.id === data.thread_id ? { ...thread, unsolved_count: thread.unsolved_count + (data.solved ? 1 : -1) } : thread,
        'update',
      );
    });
  };

  useFixMouseLeave(boxRef, () => {
    setHover(false);
  });

  return (
    <Box
      className="comment-view"
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
        {...data.author}
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
        variant={data.parent_id ? 'small' : 'medium'}
        sx={{ flexGrow: 1 }}
      >
        <Box
          className={`comment-content ${data.is_question ? 'question' : ''}`}
          sx={{ flexGrow: 1, gap: 0.4, display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ mr: '1.5em' }}>
            {/* edit comment */}
            <Collapse in={inEditing} unmountOnExit>
              <Write
                url={url}
                data={data}
                onClose={() => setInEditing(false)}
                autoFocus
                editor={editor}
                disableSelect={disableSelect}
                ratingMode={ratingMode}
              />
            </Collapse>

            {/* view content */}
            <Collapse in={!inEditing} unmountOnExit>
              <ContentBox content={data.content} deleted={data.deleted} resourceKind={resourceKind} url={url} />
            </Collapse>
          </Box>

          {!data.deleted && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gap: 1, ...(!user && { pointerEvents: 'none' }) }}>
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
              {!disableReply && user && !data.parent_id && (data.children?.length || 0) < 30 && (
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

              <Box sx={{ flexGrow: 1 }} />
              {ratingMode && data.rating != null && <Rating value={data.rating} precision={0.5} readOnly size="small" />}
            </Stack>
          )}

          {/* write reply */}
          {!data.parent_id && (
            <Collapse in={inWriting} unmountOnExit>
              <Write url={url} parent={data} onClose={() => setInWrting(false)} autoFocus editor={editor} />
            </Collapse>
          )}

          {!disableReply && (data.children?.length as number) > 0 && (
            <>
              <Button sx={{ py: 0, alignSelf: 'flex-start' }} onClick={() => setShowReplies((prev) => !prev)} size="small">
                {showReplies ? <ArrowDropDown /> : <ArrowDropUp />}
                {t('Replies')} {data.children?.length.toLocaleString()}
              </Button>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {showReplies &&
                  data.children?.map((child: DisplayResponse) => (
                    <Comment
                      url={url}
                      key={child.id}
                      data={child}
                      setParentHover={setHover}
                      resourceKind={resourceKind}
                      editor={editor}
                    />
                  ))}
              </Box>
            </>
          )}
        </Box>
      </WithAvatar>

      {user && !data.deleted && (
        <Box
          className="comment-action-menu"
          sx={{ visibility: !hover ? 'hidden' : 'visible', position: 'absolute', right: 0, top: '1em' }}
        >
          <ActionMenu
            url={url}
            data={data}
            onEdit={() => {
              setInWrting(false);
              setInEditing(true);
            }}
            disableSelect={disableSelect}
            ratingMode={ratingMode}
          />
        </Box>
      )}
    </Box>
  );
};

interface ContentBoxProps {
  content: string;
  deleted: boolean;
  resourceKind: string;
  url: string;
}

const ContentBox = ({ content, deleted, resourceKind, url }: ContentBoxProps) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const navigate = useNavigate();
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const baseStyles = {
    fontSize: theme.typography.body1.fontSize,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.4,
    display: 'block !important',
    color: deleted ? theme.palette.text.disabled : theme.palette.text.primary,
    '& img': { cursor: 'pointer', maxWidth: '100%', height: 'auto' },
  };

  if (deleted) {
    return (
      <Box className="tiptap-content" sx={baseStyles}>
        {t('Deleted')}
      </Box>
    );
  }

  const videoId = decodeURIComponent(url).split('/').pop();
  let htmlContent = content;

  if (resourceKind === 'video') {
    const timePattern = /((?:\d{1,2}:)?(?:\d{1,2}:\d{2}))/g;
    htmlContent = content.replace(timePattern, (match) => {
      const t = durationToSeconds(match);
      return `<span class="timestamp-link" style="font-size: .9em; color: ${theme.palette.info.main}; background-color: ${alpha(theme.palette.info.main, 0.1)}; padding: 0 8px; border-radius: 16px; cursor: pointer; margin-right: 4px" data-time="${t}" data-video-id="${videoId}">${match}</span>`;
    });
  }

  return (
    <>
      <Box
        className="tiptap-content"
        sx={{
          ...baseStyles,
          '& .timestamp-link:hover': {
            bgcolor: alpha(theme.palette.info.main, 0.2),
          },
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('timestamp-link')) {
            const time = target.dataset.time;
            const videoId = target.dataset.videoId;
            if (time && videoId) {
              navigate(`/video/${videoId}?t=${time}`);
            }
          }

          // image click
          if (target.tagName.toLowerCase() === 'img') {
            const imgSrc = target.getAttribute('src');
            if (imgSrc) {
              setSelectedImage(imgSrc);
              setOpenImageDialog(true);
            }
          }
        }}
      />

      <Dialog open={openImageDialog} onClick={() => setOpenImageDialog(false)} maxWidth="lg">
        <DialogContent sx={{ p: 0, textAlign: 'center', bgcolor: 'black', display: 'flex' }}>
          <img src={selectedImage} alt="" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 64px)', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </>
  );
};
