import { Box, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Finding } from './Finding';

import {
  ExamAttemptResponse as AttemptResponse,
  ExamGetAttemptData as GetAttemptData,
  examGetAttempt as getAttempt,
} from '@/api';
import { useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale, toFixedHuman } from '@/helper/util';

export const Result = ({ id }: { id: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { data } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!data || !data.status || !data.submission) return null;

  return (
    <>
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
              <TableCell>
                <Chip
                  label={t(data.status)}
                  color={getStatusColor(data.status)}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    py: 0.5,
                    px: 1,
                  }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Divider sx={{ mb: 3, width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <Box sx={{ px: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.final_message }} />
      <Finding id={id} />
    </>
  );
};
