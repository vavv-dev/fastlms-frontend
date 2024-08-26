import { ExamAssessResponse as AssessResponse, ExamGetAssessData as GetAssessData, examGetAssess as getAssess } from '@/api';
import { ThreadDialog } from '@/component/comment';
import { useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale, toFixedHuman } from '@/helper/util';
import { Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Finding } from './Finding';

export const Result = ({ id }: { id: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { data } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id });
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);

  if (!data || !data.status || !data.submission) return null;

  return (
    <>
      <Button
        onClick={() => setThreadDialogOpen((prev) => !prev)}
        sx={{ flexShrink: 0, position: 'absolute', right: '2em', top: '2.8em' }}
      >
        {t('Q&A')}
      </Button>

      <Divider sx={{ width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <TableContainer sx={{ bgcolor: theme.palette.action.hover, py: 3, position: 'relative' }}>
        <Table size="small" sx={{ '& th': { fontWeight: 600 }, '& td, & th': { textAlign: 'center', border: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('Start time')}</TableCell>
              <TableCell>{t('Finish time')}</TableCell>
              <TableCell>{t('Score')}</TableCell>
              <TableCell>{t('Result')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{formatDatetimeLocale(data.submission.start_time)}</TableCell>
              <TableCell>{formatDatetimeLocale(data.submission.end_time)}</TableCell>
              <TableCell>{toFixedHuman(data.score, 1)}</TableCell>
              <TableCell>{t(data.status)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Divider sx={{ mb: 3, width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <Finding id={id} />

      <ThreadDialog
        open={threadDialogOpen}
        setOpen={setThreadDialogOpen}
        threadProps={{
          url: encodeURIComponent(`${location.origin}/exam/${data.id}`),
          title: data.title,
          owner: data.owner,
          kind: 'exam',
          question: true,
          sticky: true,
        }}
      />
    </>
  );
};
