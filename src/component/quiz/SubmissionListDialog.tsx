import {
  QuizDisplayResponse,
  QuizGetQuizSubmissionsData,
  QuizSubmissionResponse,
  quizDownloadQuizSubmissions,
  quizGetQuizSubmissions,
} from '@/api';
import { BaseDialog, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { base64XlsxDownload, formatDatetimeLocale } from '@/helper/util';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IProps {
  quiz: QuizDisplayResponse;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SubmissionListDialog = ({ open, setOpen, quiz }: IProps) => {
  const { t } = useTranslation('quiz');
  const [asOf, setAsOf] = useState<string>('');
  const [upTo, setUpTo] = useState<string>('');

  const downlaodXlsxFile = async () => {
    if (!quiz) return;
    const text = await quizDownloadQuizSubmissions({
      id: quiz.id,
      asOf: String(new Date(asOf).getTime() || '') || null,
      upTo: String(new Date(upTo).getTime() || '') || null,
    });
    const filename = `${quiz.title}.${asOf || 'all'}~${upTo || new Date().toISOString().slice(0, 16)}.xlsx`;
    base64XlsxDownload(text, filename);
  };

  if (!quiz) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="md"
      title={quiz.title}
      actions={<Button onClick={downlaodXlsxFile}>{t('Download report')}</Button>}
      renderContent={() => (
        <GridInfiniteScrollPage<QuizSubmissionResponse, QuizGetQuizSubmissionsData>
          pageKey="answerlist"
          apiService={quizGetQuizSubmissions}
          apiOptions={{
            id: quiz.id,
            asOf: String(new Date(asOf).getTime() || ''),
            upTo: String(new Date(upTo).getTime() || ''),
          }}
          renderItem={({ data }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                <TextField
                  label={t('As of')}
                  size="small"
                  type="datetime-local"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                ~
                <TextField
                  label={t('Up to')}
                  size="small"
                  type="datetime-local"
                  value={upTo}
                  onChange={(e) => setUpTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <TableContainer sx={{ '& th, & td': { textAlign: 'center' } }}>
                <Table size="small" sx={{ tableLayout: 'fixed', '& *': { whiteSpace: 'noWrap' }, '& td': { px: 1 } }}>
                  <TableHead>
                    <TableRow>
                      {[t('User'), t('Start time'), t('End time'), t('Score'), t('Status')].map((label) => (
                        <TableCell key={label}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.map((pagination, i) =>
                      pagination.items?.map((submission: QuizSubmissionResponse) => (
                        <TableRow key={i}>
                          <TableCell>
                            <WithAvatar {...submission.user} variant="small" />
                          </TableCell>
                          <TableCell>{formatDatetimeLocale(submission.start_time)}</TableCell>
                          <TableCell>{formatDatetimeLocale(submission.end_time)}</TableCell>
                          <TableCell>{submission.score}</TableCell>
                          <TableCell>{submission.status && t(submission.status)}</TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          boxPadding={0}
          gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
        />
      )}
    />
  );
};

export default SubmissionListDialog;
