import { CommentDisplayResponse, CommentGetDisplaysData, LearningResourceKind, commentGetDisplays } from '@/api';
import { ThreadDialog } from '@/component/comment';
import { GridInfiniteScrollPage } from '@/component/common';
import { calculateReverseIndex, formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Comment = () => {
  const { t } = useTranslation('u');
  const user = useAtomValue(userState);

  return (
    <GridInfiniteScrollPage<CommentDisplayResponse, CommentGetDisplaysData>
      pageKey="commentlist"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'like_count', label: t('Like count') },
      ]}
      apiService={commentGetDisplays}
      apiOptions={{ authorId: user?.id }}
      renderItem={({ data }) => (
        <TableContainer>
          <Table sx={{ '& th,td': { whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">no</TableCell>
                <TableCell align="center">{t('Type')}</TableCell>
                <TableCell align="center">{t('Created')}</TableCell>
                <TableCell>{t('Comment')}</TableCell>
                <TableCell align="center">{t('Unsolved')}</TableCell>
                <TableCell align="center">{t('Like')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((pagination, pageIndex) =>
                pagination.items?.map((row, rowIndex) => (
                  <CommentRow
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
      boxPadding={0}
    />
  );
};

const CommentRow = ({ row, index }: { row: CommentDisplayResponse; index: number }) => {
  const { t } = useTranslation('u');
  const user = useAtomValue(userState);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <TableRow
      onClick={() => setThreadDialogOpen(true)}
      key={row.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{index}</TableCell>
      <TableCell align="center">{row.is_question ? t('Question') : t('Comment')}</TableCell>
      <TableCell align="center">{t(...formatRelativeTime(row.created))}</TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: 'text.secondary', ...textEllipsisCss(1) }}>
          [{t(row.thread_kind || '')}] {row.thread_title}
        </Typography>
        <Typography variant="body2" sx={{ ...textEllipsisCss(1), whiteSpace: 'wrap' }}>
          {row.content}
        </Typography>
      </TableCell>
      <TableCell align="center">{!row.solved && row.is_question && t('Unsolved')}</TableCell>
      <TableCell align="center">{row.like_count}</TableCell>

      {threadDialogOpen && (
        <ThreadDialog
          open={threadDialogOpen}
          setOpen={setThreadDialogOpen}
          threadProps={{
            url: row.thread_url || '',
            title: row.thread_title || '',
            owner: user,
            kind: row.thread_kind as LearningResourceKind,
            question: row.is_question,
            sticky: true,
          }}
        />
      )}
    </TableRow>
  );
};
