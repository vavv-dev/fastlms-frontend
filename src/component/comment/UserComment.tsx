import { CommentGetThreadsData, ThreadResponse, commentGetThreads } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { textEllipsisCss } from '@/helper/util';
import { homeUserState } from '@/store';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CommentDialog, ICommentThreadProps } from '.';

const UserComment = () => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const navigate = useNavigate();
  const homeUser = useAtomValue(homeUserState);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentThreadProps, setCommentThreadProps] = useState<ICommentThreadProps | null>(null);

  const openCommentDialog = (thread: ThreadResponse) => {
    if (!homeUser) return;
    setCommentThreadProps({
      url: thread.url,
      title: thread.title,
      owner: homeUser,
      kind: thread.kind,
      question: true,
      sticky: true,
    });
    setCommentDialogOpen(true);
  };

  return (
    <>
      <GridInfiniteScrollPage<ThreadResponse, CommentGetThreadsData>
        pageKey="commentlist"
        orderingOptions={[
          { value: 'created', label: t('Recently created') },
          { value: 'comment_count', label: t('Comment count') },
          { value: 'question_count', label: t('Question count') },
          { value: 'unsolved_count', label: t('Unsolved count') },
        ]}
        apiService={commentGetThreads}
        apiOptions={{ ownerId: homeUser?.id }}
        renderItem={({ data }) => (
          <TableContainer>
            <Table sx={{ '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">no</TableCell>
                  <TableCell align="center">{t('Type')}</TableCell>
                  <TableCell align="center">{t('Comment subject')}</TableCell>
                  <TableCell align="center">{t('Comment')}</TableCell>
                  <TableCell align="center">{t('Question')}</TableCell>
                  <TableCell align="center">{t('Unsolved')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((pagination) =>
                  pagination.items?.map((row, i) => (
                    <TableRow
                      onClick={() => openCommentDialog(row)}
                      key={row.id}
                      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                    >
                      <TableCell align="center">{pagination.total - (pagination.page - 1) * pagination.pages - i}</TableCell>
                      <TableCell align="center">{t(row.kind || '')}</TableCell>
                      <TableCell
                        sx={{ minWidth: '300px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(decodeURIComponent(row.url).replace(location.origin, ''));
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                          {row.thumbnail && (
                            <Box
                              component="img"
                              src={row.thumbnail}
                              sx={{
                                width: '130px',
                                aspectRatio: '16 / 9',
                                objectFit: 'cover',
                                borderRadius: theme.shape.borderRadius / 2,
                                display: { xs: 'none', sm: 'block' },
                              }}
                            />
                          )}
                          <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700, ...textEllipsisCss(3) }}>
                            {row.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{row.comment_count?.toLocaleString()}</TableCell>
                      <TableCell align="center">{row.question_count?.toLocaleString()}</TableCell>
                      <TableCell align="center" sx={{ color: row.unsolved_count ? 'error.light' : 'inherit' }}>
                        {row.unsolved_count?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
      />
      {commentDialogOpen && commentThreadProps && (
        <CommentDialog open={commentDialogOpen} setOpen={setCommentDialogOpen} commentThreadProps={commentThreadProps} />
      )}
    </>
  );
};

export default UserComment;
