import { ExamAssessResponse, ExamGetAssessData, examGetAssess } from '@/api';
import { CommentDialog } from '@/component/comment';
import { useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale, toFixedHuman } from '@/helper/util';
import { Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExamFinding from './ExamFinding';

const ExamResult = ({ examId }: { examId: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { data: exam } = useServiceImmutable<ExamGetAssessData, ExamAssessResponse>(examGetAssess, { id: examId });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  if (!exam || !exam.status || !exam.submission) return null;

  return (
    <>
      <Button
        onClick={() => setCommentDialogOpen((prev) => !prev)}
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
              <TableCell>{formatDatetimeLocale(exam.submission.start_time)}</TableCell>
              <TableCell>{formatDatetimeLocale(exam.submission.end_time)}</TableCell>
              <TableCell>{toFixedHuman(exam.score, 1)}</TableCell>
              <TableCell>{t(exam.status)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Divider sx={{ mb: 3, width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <ExamFinding examId={examId} />

      <CommentDialog
        open={commentDialogOpen}
        setOpen={setCommentDialogOpen}
        commentThreadProps={{
          url: encodeURIComponent(`${location.origin}/exam/${exam.id}`),
          title: exam.title,
          owner: exam.owner,
          kind: 'exam',
          question: true,
          sticky: true,
        }}
      />
    </>
  );
};

export default ExamResult;
