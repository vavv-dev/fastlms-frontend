import {
  VideoDisplayResponse,
  VideoGetVideoReportData,
  VideoReportResponse,
  videoDownloadVideoReport,
  videoGetVideoReport,
} from '@/api';
import { BaseDialog, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { base64XlsxDownload, formatDatetimeLocale, toFixedHuman } from '@/helper/util';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IProps {
  video: VideoDisplayResponse;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ReportDialog = ({ open, setOpen, video }: IProps) => {
  const { t } = useTranslation('video');
  const [asOf, setAsOf] = useState<string>('');
  const [upTo, setUpTo] = useState<string>('');

  const downlaodXlsxFile = async () => {
    if (!video) return;
    const text = await videoDownloadVideoReport({
      id: video.id,
      asOf: String(new Date(asOf).getTime() || '') || null,
      upTo: String(new Date(upTo).getTime() || '') || null,
    });
    const filename = `${video.title}.${asOf || 'all'}~${upTo || new Date().toISOString().slice(0, 16)}.xlsx`;
    base64XlsxDownload(text, filename);
  };

  if (!video) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="md"
      title={video.title}
      actions={<Button onClick={downlaodXlsxFile}>{t('Download report')}</Button>}
      renderContent={() => (
        <GridInfiniteScrollPage<VideoReportResponse, VideoGetVideoReportData>
          pageKey="answerlist"
          apiService={videoGetVideoReport}
          apiOptions={{
            id: video.id,
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
                      {[t('User'), t('First watch'), t('Last watch'), t('Progress'), t('Status')].map((label) => (
                        <TableCell key={label}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.map((pagination, i) =>
                      pagination.items?.map((watch: VideoReportResponse) => (
                        <TableRow key={i}>
                          <TableCell>
                            <WithAvatar {...watch.user} variant="small" />
                          </TableCell>
                          <TableCell>{formatDatetimeLocale(watch.first_watch)}</TableCell>
                          <TableCell>{formatDatetimeLocale(watch.watched_at)}</TableCell>
                          <TableCell>{toFixedHuman(watch.progress, 1)}%</TableCell>
                          <TableCell>{watch.passed ? t('Passed') : ''}</TableCell>
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

export default ReportDialog;
