import { BarChart } from '@mui/icons-material';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  QuizDisplayResponse as DisplayResponse,
  QuizGetQuizReportData as GetReportData,
  QuizReportResponse as ReportResponse,
  quizDownloadQuizReport as downloadReport,
  quizGetQuizReport as getReport,
} from '@/api';
import { BaseDialog, EmptyMessage, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { base64XlsxDownload, formatDatetimeLocale, toFixedHuman } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ReportDialog = ({ open, setOpen, data }: Props) => {
  const { t } = useTranslation('quiz');
  const [asOf, setAsOf] = useState<string>('');
  const [upTo, setUpTo] = useState<string>('');

  const downlaodXlsxFile = async () => {
    if (!data) return;
    const text = await downloadReport({
      id: data.id,
      asOf: String(new Date(asOf).getTime() || '') || null,
      upTo: String(new Date(upTo).getTime() || '') || null,
    });
    const filename = `${data.title}.${asOf || 'all'}~${upTo || new Date().toISOString().slice(0, 16)}.xlsx`;
    base64XlsxDownload(text, filename);
  };

  if (!data) return null;

  return (
    <BaseDialog
      isReady
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="md"
      actions={<Button onClick={downlaodXlsxFile}>{t('Download report')}</Button>}
      renderContent={() => (
        <GridInfiniteScrollPage<ReportResponse, GetReportData>
          disableSticky
          pageKey="answerlist"
          apiService={getReport}
          apiOptions={{
            id: data.id,
            asOf: String(new Date(asOf).getTime() || ''),
            upTo: String(new Date(upTo).getTime() || ''),
          }}
          renderItem={({ data: item }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="subtitle1" sx={{ alignSelf: 'center' }}>
                {data.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                <TextField
                  label={t('As of')}
                  size="small"
                  type="datetime-local"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                ~
                <TextField
                  label={t('Up to')}
                  size="small"
                  type="datetime-local"
                  value={upTo}
                  onChange={(e) => setUpTo(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
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
                    {item?.map((pagination) =>
                      pagination.items?.map((submission: ReportResponse) => (
                        <TableRow key={submission.user.id}>
                          <TableCell>
                            <WithAvatar {...submission.user} variant="small" />
                          </TableCell>
                          <TableCell>{formatDatetimeLocale(submission.start_time)}</TableCell>
                          <TableCell>{formatDatetimeLocale(submission.end_time)}</TableCell>
                          <TableCell>{toFixedHuman(submission.score, 1)}</TableCell>
                          <TableCell>{submission.status && t(submission.status)}</TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          emptyMessage={<EmptyMessage Icon={BarChart} message={t('No report data found.')} />}
          boxPadding={0}
          gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
        />
      )}
    />
  );
};
