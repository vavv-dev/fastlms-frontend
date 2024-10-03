import {
  AccountGetBookmarkedContentData,
  BookmarkedContentResponse,
  accountGetBookmarkedContent,
  accountToggleBookmark,
} from '@/api';
import { GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { ExamReadyDialog } from '@/component/exam';
import { QuizViewDialog } from '@/component/quiz';
import { SurveyViewDialog } from '@/component/survey';
import { formatDatetimeLocale, formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';
import { BookmarkBorderOutlined, BookmarkOutlined } from '@mui/icons-material';
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const Bookmark = () => {
  const { t } = useTranslation('u');

  return (
    <GridInfiniteScrollPage<BookmarkedContentResponse, AccountGetBookmarkedContentData>
      pageKey="bookmarkedcontent"
      orderingOptions={[
        { value: 'bookmarked_at', label: t('Recently Bookmarked') },
        { value: 'title', label: t('Title asc') },
      ]}
      apiService={accountGetBookmarkedContent}
      apiOptions={{ kind: null }}
      renderItem={({ data }) => (
        <TableContainer>
          <Table sx={{ '& th,td': { whiteSpace: 'nowrap', border: 'none' }, '& td': { py: 1 } }}>
            <TableBody>
              {data?.map((pagination) =>
                pagination.items?.map((row) => {
                  return <ContentRow row={row} key={row.id} />;
                }),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
      boxPadding={0}
    />
  );
};

const ContentRow = ({ row }: { row: BookmarkedContentResponse }) => {
  const { t } = useTranslation('u');
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const [bookmarked, setBookmarked] = useState(true);

  const [quizViewDialogOpen, setQuizViewDialogOpen] = useState(false);
  const [surveyViewDialogOpen, setSurveyViewDialogOpen] = useState(false);
  const [examReadyDialogOpen, setExamReadyDialogOpen] = useState(false);

  const toggleBookmark = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    accountToggleBookmark({ kind: row.kind, id: row.id })
      .then(() => {
        setBookmarked((prev) => !prev);
        // Do not update cache here for re-bookmarking
      })
      .catch(console.error);
  };

  if (!user) return null;

  const openContent = () => {
    switch (row.kind) {
      case 'video':
      case 'playlist':
      case 'course':
        navigate(`/${row.kind}/${row.id}`);
        break;
      case 'quiz':
        setQuizViewDialogOpen(true);
        break;
      case 'survey':
        setSurveyViewDialogOpen(true);
        break;
      case 'exam':
        setExamReadyDialogOpen(true);
        break;
      case 'lesson':
        navigate(`/channel/${row.owner_username}/lesson`, { state: { search: row.id } });
        break;
    }
  };

  return (
    <TableRow onClick={openContent} key={row.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}>
      <TableCell align="center">{t(row.kind)}</TableCell>
      <TableCell sx={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
        {row.thumbnail && (
          <Box
            sx={{
              display: { xs: 'none', sm: 'block' },
              backgroundImage: `url(${row.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: '140px',
              minWidth: '140px',
              aspectRatio: '16/9',
              borderRadius: 2,
            }}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5em', flexGrow: 1 }}>
          <Typography variant="body2" sx={{ ...textEllipsisCss(2), whiteSpace: 'wrap' }}>
            {row.title}
          </Typography>
          <WithAvatar variant="small" name={row.owner_name} username={row.owner_username} thumbnail={row.owner_thumbnail}>
            <Typography component="div" variant="caption">
              {t(...formatRelativeTime(row.created))}
            </Typography>
          </WithAvatar>
        </Box>
      </TableCell>
      <TableCell align="center">
        <Tooltip title={formatDatetimeLocale(row.bookmarked_at)}>
          <span>{t(...formatRelativeTime(row.bookmarked_at))}</span>
        </Tooltip>
      </TableCell>
      <TableCell align="center">
        <Tooltip title={bookmarked ? t('Bookmarked') : t('Add to bookmark')}>
          <IconButton onClick={toggleBookmark}>{bookmarked ? <BookmarkOutlined /> : <BookmarkBorderOutlined />}</IconButton>
        </Tooltip>
      </TableCell>
      {quizViewDialogOpen && <QuizViewDialog open={quizViewDialogOpen} setOpen={setQuizViewDialogOpen} id={row.id} />}
      {surveyViewDialogOpen && <SurveyViewDialog open={surveyViewDialogOpen} setOpen={setSurveyViewDialogOpen} id={row.id} />}
      {examReadyDialogOpen && <ExamReadyDialog open={examReadyDialogOpen} setOpen={setExamReadyDialogOpen} id={row.id} />}
    </TableRow>
  );
};
