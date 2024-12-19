import { Chat } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CommentGetThreadsData, ThreadResponse, commentGetThreads } from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { calculateReverseIndex, textEllipsisCss } from '@/helper/util';
import { channelState, userState } from '@/store';

interface Props {
  mode?: 'owner' | 'commenter';
}

export const Displays = ({ mode = 'owner' }: Props) => {
  const { t } = useTranslation('comment');
  const channel = useAtomValue(channelState);
  const user = useAtomValue(userState);

  return (
    <GridInfiniteScrollPage<ThreadResponse, CommentGetThreadsData>
      pageKey="commentlist"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'comment_count', label: t('Comment count') },
        { value: 'question_count', label: t('Question count') },
        { value: 'unsolved_count', label: t('Unsolved count') },
      ]}
      apiService={commentGetThreads}
      apiOptions={mode === 'owner' ? { ownerId: channel?.owner.id } : { commenterId: user?.id }}
      renderItem={({ data }) => (
        <TableContainer>
          <Table sx={{ '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' }, '& td': { py: 1 } }}>
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
                  <ThreadRow row={row} index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)} key={row.id} />
                )),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      emptyMessage={<EmptyMessage Icon={Chat} message={t('No comments found.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr' }}
    />
  );
};

const ThreadRow = ({ row, index }: { row: ThreadResponse; index: number }) => {
  const { t } = useTranslation('comment');
  const navigate = useNavigate();

  return (
    <TableRow
      onClick={() => navigate(`${decodeURIComponent(row.url).split(window.location.origin)[1]}`)}
      key={row.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{index}</TableCell>
      <TableCell align="center">{t(row.resource_kind || '')}</TableCell>
      <TableCell sx={{ minWidth: '300px' }}>
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
          <Box
            sx={{
              backgroundImage: `url(${row.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: '100px',
              minWidth: '100px',
              aspectRatio: '16/9',
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          />
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
  );
};
