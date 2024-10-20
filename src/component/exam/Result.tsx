import { ExamAssessResponse as AssessResponse, ExamGetAssessData as GetAssessData, examGetAssess as getAssess } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { formatDatetimeLocale, toFixedHuman } from '@/helper/util';
import { Box, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Finding } from './Finding';

export const Result = ({ id }: { id: string }) => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();
  const theme = useTheme();
  const { data } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id });

  if (!data || !data.status || !data.submission) return null;

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          navigate('.', { state: { dialog: { question: true, ...data } } });
        }}
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
      <Box sx={{ px: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.final_message }} />
      <Finding id={id} />
    </>
  );
};
