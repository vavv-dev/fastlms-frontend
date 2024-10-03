import {
  LessonDisplayResponse as DisplayResponse,
  lessonGetDisplays as getDisplays,
  lessonUpdateResource as updateResource,
} from '@/api';
import { ThreadDialog } from '@/component/comment';
import { WithAvatar, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { decodeURLText, formatRelativeTime, generateRandomDarkColor } from '@/helper/util';
import { ArrowRight, BookmarkBorderOutlined, HelpOutlineOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from './ActionMenu';
import { ResourceViewer } from './ResourceViewer';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  showDescription?: boolean;
  embeded?: boolean;
}

export const Card = ({ data, hideAvatar, embeded }: Props) => {
  const { t } = useTranslation('lesson');
  const theme = useTheme();
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
        gap: 3,
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        p: { xs: 2, sm: 3 },
        position: 'relative',
      }}
    >
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
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'none' },
            '& .MuiButton-root': { pointerEvents: 'auto' },
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

      <WithAvatar name={data.owner.name} username={data.owner.username} thumbnail={data.owner.thumbnail} hideAvatar={hideAvatar}>
        <Stack sx={{ color: 'text.secondary' }} direction="row" spacing={1}>
          <Typography variant="subtitle2">{t(...formatRelativeTime(data.modified))}</Typography>
          {data.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
        </Stack>
        <Box sx={{ visibility: !hover ? 'hidden' : 'visible', position: 'absolute', right: '-8px' }}>
          <ActionMenu data={data} />
        </Box>
      </WithAvatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {!embeded && (
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
                      label={`${course.title} ${course.order + 1}`}
                      // onClick={(e) => {
                      //   // TODO navigate to course marketing page
                      // }}
                      sx={{
                        bgcolor: generateRandomDarkColor(course.title, 1, 0.2),
                        '&:hover': { bgcolor: generateRandomDarkColor(course.title, 1, 0.4) },
                      }}
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
          </Box>
        )}
        <Box
          dangerouslySetInnerHTML={{ __html: decodeURLText(data.description) }}
          sx={{ whiteSpace: 'pre-wrap', '& p': { my: 0 } }}
        />
        <TableContainer sx={{ '& td': { border: 'none' } }}>
          <Typography sx={{ fontWeight: '600' }}>{t('Lesson Resources')}</Typography>
          <Table size="small">
            <TableBody>
              {data.resources.map((resource, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ width: '80px' }}>{t(resource.kind)}</TableCell>
                  <TableCell sx={{ py: '4px', width: '80px' }}>
                    <Box
                      sx={{
                        backgroundImage: `url(${resource.thumbnail})`,
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
