import {
  LessonDisplayResponse as DisplayResponse,
  lessonGetDisplays as getDisplays,
  lessonToggleAction as toggleAction,
  lessonUpdateResource as updateResource,
} from '@/api';
import { ThreadDialog } from '@/component/comment';
import { WithAvatar, createToggleAction, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { decodeURLText, formatRelativeTime, generateRandomDarkColor, humanNumber } from '@/helper/util';
import { ArrowRight, BookmarkBorderOutlined, HelpOutlineOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';
import { ResourceViewer } from './ResourceViewer';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  showDescription?: boolean;
}

const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays);

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('lesson');
  const theme = useTheme();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  // learning resource view
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);

  // Fix  with hovering
  useFixMouseLeave(cardRef, () => {
    setHover(false);
  });

  const updateField = async (params: Partial<DisplayResponse>) => {
    await updateResource({
      id: data.id,
      requestBody: params,
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { id: data.id, is_public: true }, 'update');
    });
  };

  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={(e) => {
        if (e.relatedTarget == window) return;
        setHover(false);
      }}
      sx={{
        display: 'flex',
        gap: 1,
        flexDirection: 'column',
      }}
    >
      <WithAvatar name={data.owner.name} username={data.owner.username} thumbnail={data.owner.thumbnail} hideAvatar={hideAvatar}>
        <Stack sx={{ color: 'text.secondary' }} direction="row" spacing={1}>
          <Typography variant="subtitle2">{t(...formatRelativeTime(data.modified))}</Typography>
          <Typography variant="subtitle2">{`${t('Bookmark')} ${humanNumber(data.bookmark_count)}`}</Typography>
          {data.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
        </Stack>
        <Box sx={{ display: !hover ? 'none' : 'block', position: 'absolute', right: '-8px' }}>
          <ActionMenu data={data} />
        </Box>
      </WithAvatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', p: data.is_public ? 0 : 3 }}>
        {!data.is_public && (
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              right: 0,
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              zIndex: 3,
              p: 1,
              borderRadius: theme.shape.borderRadius / 2,
              // pointerEvents: 'none',
              pointerEvents: 'none',
              '& > *': {
                pointerEvents: 'none',
              },
              '& .MuiButton-root': {
                pointerEvents: 'auto',
              },
            }}
          >
            <Button
              size="small"
              sx={{ color: 'white', p: 0 }}
              endIcon={<ArrowRight />}
              onClick={(e) => {
                e.stopPropagation();
                updateField({ is_public: true });
              }}
            >
              {t('Change to public')}
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          {data.thumbnail && (
            <Box
              sx={{
                width: '100px',
                aspectRatio: '16 / 9',
                backgroundImage: `url(${data.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: theme.shape.borderRadius / 2,
              }}
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
            <Typography variant="h6" sx={{ fontWeight: '600', lineHeight: 1.2 }}>
              {data.title}
            </Typography>

            {data.related_courses?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, color: 'text.secondary', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('Related courses')}
                </Typography>
                {data.related_courses.map((course) => (
                  <Chip
                    size="small"
                    key={course.id}
                    label={`${course.title} ${course.order}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course/${course.id}`);
                    }}
                    sx={{ bgcolor: generateRandomDarkColor(course.title, 1, 0.2) }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            startIcon={<HelpOutlineOutlined fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              setThreadDialogOpen((prev) => !prev);
            }}
            sx={{ p: 0 }}
          >
            {t('Q&A')}
          </Button>
          {!data.bookmarked && (
            <Tooltip title={t('Add bookmark')}>
              <IconButton size="small" onClick={() => action('bookmark', data)}>
                <BookmarkBorderOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box
          dangerouslySetInnerHTML={{ __html: decodeURLText(data.description) }}
          sx={{ whiteSpace: 'pre-wrap', '& p': { my: 0 } }}
        />
        <TableContainer sx={{ '& td': { py: 1.5 }, mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: '600' }}>
            {t('Lesson Resources')}
          </Typography>
          <Table>
            <TableBody>
              {data.resources.map((resource, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ width: '80px' }}>{t(resource.kind)}</TableCell>
                  <TableCell sx={{ py: '4px !important', width: '82px', height: '56px !important' }}>
                    <Box
                      sx={{
                        backgroundImage: `url(${resource.thumbnail})`,
                        backgroundColor: theme.palette.action.hover,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        width: '80px',
                        height: 'auto',
                        aspectRatio: '16/9',
                        borderRadius: '4px',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <ResourceViewer resource={resource} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {threadDialogOpen && (
        <ThreadDialog
          open={threadDialogOpen}
          setOpen={setThreadDialogOpen}
          threadProps={{
            url: encodeURIComponent(`${location.origin}/lesson/${data.id}`),
            title: data.title,
            owner: data.owner,
            kind: 'lesson',
            question: true,
            sticky: true,
          }}
        />
      )}
    </Box>
  );
};
