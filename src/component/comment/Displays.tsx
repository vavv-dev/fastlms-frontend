import { CommentGetThreadsData, ThreadResponse, commentGetThreads } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { calculateReverseIndex, textEllipsisCss } from '@/helper/util';
import { homeUserState } from '@/store';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThreadDialog } from '.';

export const Displays = () => {
  const { t } = useTranslation('comment');
  const homeUser = useAtomValue(homeUserState);

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
                {data?.map((pagination, pageIndex) =>
                  pagination.items?.map((row, rowIndex) => (
                    <ThreadRow
                      row={row}
                      index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)}
                      key={row.id}
                    />
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
      />
    </>
  );
};

const ThreadRow = ({ row, index }: { row: ThreadResponse; index: number }) => {
  const { t } = useTranslation('comment');
  const theme = useTheme();
  const homeUser = useAtomValue(homeUserState);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);

  if (!homeUser) return null;

  return (
    <TableRow
      onClick={() => setThreadDialogOpen(true)}
      key={row.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{index}</TableCell>
      <TableCell align="center">{t(row.kind || '')}</TableCell>
      <TableCell sx={{ minWidth: '300px' }}>
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
      {threadDialogOpen && (
        <ThreadDialog
          open={threadDialogOpen}
          setOpen={setThreadDialogOpen}
          threadProps={{
            url: row.url,
            title: row.title,
            owner: homeUser,
            kind: row.kind,
            question: true,
            sticky: true,
          }}
        />
      )}
    </TableRow>
  );
};
