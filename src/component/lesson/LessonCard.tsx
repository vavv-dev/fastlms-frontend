import { LessonDisplayResponse, LessonResource } from '@/api';
import { CommentDialog } from '@/component/comment';
import { WithAvatar, useFixMouseLeave } from '@/component/common';
import { QuizViewDialog } from '@/component/quiz';
import { SurveyViewDialog } from '@/component/survey';
import { decodeURLText, formatRelativeTime, humanNumber } from '@/helper/util';
import { BookmarkBorderOutlined, HelpOutlineOutlined } from '@mui/icons-material';
import { Box, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, useTheme } from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ContentViewDialog from './ContentViewDialog';
import LessonActionMenu from './LessonActionMenu';

interface IProps {
  lesson: LessonDisplayResponse;
  hideAvatar?: boolean;
  showDescription?: boolean;
}

const LessonCard = ({ lesson, hideAvatar }: IProps) => {
  const { t } = useTranslation('lesson');
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  // learning resource view
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  // Fix  with hovering
  useFixMouseLeave(cardRef, () => {
    setHover(false);
  });

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
      <WithAvatar
        name={lesson.owner.name}
        username={lesson.owner.username}
        thumbnail={lesson.owner.thumbnail}
        hideAvatar={hideAvatar}
      >
        <Stack sx={{ color: 'text.secondary' }} direction="row" spacing={1}>
          <Typography variant="subtitle2">{t(...formatRelativeTime(lesson.modified))}</Typography>
          <Typography variant="subtitle2">{`${t('Bookmark')} ${humanNumber(lesson.bookmark_count, t)}`}</Typography>
          {lesson.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
          {!lesson.is_public && (
            <Typography color="error" variant="subtitle2">
              {t('Not public')}
            </Typography>
          )}
        </Stack>
        <Box sx={{ display: !hover ? 'none' : 'block', position: 'absolute', right: '-8px' }}>
          <LessonActionMenu lesson={lesson} />
        </Box>
      </WithAvatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: '600', mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {lesson.title}
          <Chip
            icon={<HelpOutlineOutlined fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              setCommentDialogOpen((prev) => !prev);
            }}
            label={t('Q&A')}
            size="small"
            color="warning"
            sx={{ fontSize: theme.typography.subtitle2 }}
          />
        </Typography>
        <Box dangerouslySetInnerHTML={{ __html: decodeURLText(lesson.description) }} sx={{ '& p': { my: 0 } }} />
        <TableContainer sx={{ '& td': { py: 1.5 }, mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: '600' }}>
            {t('Lesson Resources')}
          </Typography>
          <Table>
            <TableBody>
              {lesson.resources.map((resource, index) => (
                <TableRow key={index}>
                  <TableCell>{t(resource.kind)}</TableCell>
                  <TableCell>
                    <ResourceView resource={resource} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {commentDialogOpen && (
        <CommentDialog
          open={commentDialogOpen}
          setOpen={setCommentDialogOpen}
          commentThreadProps={{
            url: encodeURIComponent(`${location.origin}/lesson/${lesson.id}`),
            title: lesson.title,
            owner: lesson.owner,
            kind: 'lesson',
            question: true,
            sticky: true,
          }}
        />
      )}
    </Box>
  );
};

export default LessonCard;

const ResourceView = ({ resource }: { resource: LessonResource }) => {
  const navigate = useNavigate();
  const [quizViewDialogOpen, setQuizViewDialogOpen] = useState(false);
  const [surveyViewDialogOpen, setSurveyViewDialogOpen] = useState(false);
  const [contentViewDialogOpen, setContentViewDialogOpen] = useState(false);

  return (
    <>
      <Typography
        onClick={(e) => {
          e.stopPropagation();
          const kind = resource.kind;
          if (kind == 'video' || kind == 'exam') navigate(`/video/${resource.id}`);
          if (kind == 'quiz') setQuizViewDialogOpen(true);
          if (kind == 'survey') setSurveyViewDialogOpen(true);
          if (kind == 'content') setContentViewDialogOpen(true);
        }}
        variant="subtitle1"
        color="primary"
        sx={{ cursor: 'pointer', lineHeight: 1, textDecoration: 'none', '&:hover': { fontWeight: '500' } }}
      >
        {resource.title}
      </Typography>
      {quizViewDialogOpen && <QuizViewDialog open={quizViewDialogOpen} setOpen={setQuizViewDialogOpen} quizId={resource.id} />}
      {surveyViewDialogOpen && (
        <SurveyViewDialog open={surveyViewDialogOpen} setOpen={setSurveyViewDialogOpen} surveyId={resource.id} />
      )}
      {contentViewDialogOpen && (
        <ContentViewDialog open={contentViewDialogOpen} setOpen={setContentViewDialogOpen} contentId={resource.id} />
      )}
    </>
  );
};
