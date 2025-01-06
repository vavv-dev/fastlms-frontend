import {
  Box,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Finding } from './Finding';

import {
  ExamAttemptResponse as AttemptResponse,
  ExamDisplayResponse as DisplayResponse,
  ExamGetAttemptData as GetAttemptData,
  examDeleteAttempt as deleteAttempt,
  examGetAttempt as getAttempt,
  examGetDisplays as getDisplays,
} from '@/api';
import { BaseDialog, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { courseExamResetState } from '@/component/course';
import { formatDatetimeLocale, toFixedHuman } from '@/helper/util';

export const Result = ({ id }: { id: string }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const setCourseExamReset = useSetAtom(courseExamResetState);

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

  const cancelSubmit = () => {
    // for test
    deleteAttempt({
      id,
    }).then(() => {
      const state = { data, submission: null, status: null, score: null, passed: null, context: null };
      mutate((prev) => prev && { ...prev, ...state }, { revalidate: false }).then(() => setCourseExamReset(id));
      updateInfiniteCache<DisplayResponse>(getDisplays, { ...data, ...state }, 'update');
    });
  };

  if (!data || !data.status || !data.submission) return null;

  return (
    <>
      <Divider sx={{ width: '100%', borderBottomWidth: 2, borderColor: theme.palette.action.disabled }} />
      <TableContainer sx={{ bgcolor: theme.palette.action.hover, py: 3, position: 'relative' }}>
        <Table
          size="small"
          sx={{
            '& th': { fontWeight: 600, whiteSpace: 'nowrap' },
            '& td, & th': { textAlign: 'center', border: 'none' },
            '& th, & td': { px: { xs: 1, sm: 2 } },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>{t('Exam time')}</TableCell>
              <TableCell>{t('Cutoff')}</TableCell>
              <TableCell>{t('My score')}</TableCell>
              <TableCell>{t('Result')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {formatDatetimeLocale(data.submission.start_time)} ~ {formatDatetimeLocale(data.submission.end_time)}
              </TableCell>
              <TableCell>{toFixedHuman(data.cutoff_score, 1)}</TableCell>
              <TableCell>{toFixedHuman(data.score, 1)}</TableCell>
              <TableCell sx={{ position: 'relative' }}>
                <Chip
                  label={t(data.status)}
                  color={getStatusColor(data.status)}
                  sx={{ fontWeight: 'bold', fontSize: '1rem', p: 0.5 }}
                />
                <Button
                  onClick={() => setResetConfirmOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: '-1.4em',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: theme.typography.caption.fontSize,
                    minWidth: 'auto',
                    color: 'warning.main',
                    p: 0,
                  }}
                >
                  {t('Retry')}
                </Button>
                {resetConfirmOpen && (
                  <BaseDialog
                    isReady
                    maxWidth="xs"
                    fullWidth
                    open={resetConfirmOpen}
                    setOpen={setResetConfirmOpen}
                    renderContent={() => (
                      <Typography variant="body1">
                        {t('Are you sure you want to reset and retry the exam?')}
                        <br />
                        {t('This action cannot be undone.')}
                      </Typography>
                    )}
                    actions={
                      <Box sx={{ display: 'flex', gap: 2, mx: 'auto', pb: 3 }}>
                        <Button onClick={() => setResetConfirmOpen(false)}>{t('Cancel')}</Button>
                        <Button onClick={cancelSubmit} variant="contained">
                          {t('Reset and retry')}
                        </Button>
                      </Box>
                    }
                    sx={{ zIndex: theme.zIndex.modal + 1 }}
                  />
                )}
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
