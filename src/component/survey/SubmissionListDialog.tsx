import {
  SurveyDisplayResponse,
  SurveyGetSurveySubmissionsData,
  SurveySubmissionResponse,
  surveyDownloadSurveySubmissions,
  surveyGetSurveySubmissions,
} from '@/api';
import { BaseDialog, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { base64XlsxDownload, formatDatetimeLocale } from '@/helper/util';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IProps {
  survey: SurveyDisplayResponse;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SubmissionListDialog = ({ open, setOpen, survey }: IProps) => {
  const { t } = useTranslation('survey');
  const [asOf, setAsOf] = useState<string>('');
  const [upTo, setUpTo] = useState<string>('');

  const downlaodXlsxFile = async () => {
    if (!survey) return;
    const text = await surveyDownloadSurveySubmissions({
      id: survey.id,
      asOf: String(new Date(asOf).getTime() || '') || null,
      upTo: String(new Date(upTo).getTime() || '') || null,
    });
    const filename = `${survey.title}.${asOf || 'all'}~${upTo || new Date().toISOString().slice(0, 16)}.xlsx`;
    base64XlsxDownload(text, filename);
  };

  if (!survey) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="md"
      title={survey.title}
      actions={<Button onClick={downlaodXlsxFile}>{t('Download report')}</Button>}
      renderContent={() => (
        <GridInfiniteScrollPage<SurveySubmissionResponse, SurveyGetSurveySubmissionsData>
          pageKey="answerlist"
          apiService={surveyGetSurveySubmissions}
          apiOptions={{
            id: survey.id,
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
                      {[t('User'), t('End time'), t('Status')].map((label) => (
                        <TableCell key={label}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.map((pagination, i) =>
                      pagination.items?.map((submission: SurveySubmissionResponse) => (
                        <TableRow key={i}>
                          <TableCell>
                            <WithAvatar {...submission.user} variant="small" />
                          </TableCell>
                          <TableCell>{formatDatetimeLocale(submission.end_time)}</TableCell>
                          <TableCell>{submission.status && t('Submitted')}</TableCell>
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
