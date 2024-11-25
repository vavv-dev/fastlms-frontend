import { Grading } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { ViewDialog } from './ViewDialog';

import {
  ExamGetGradingSubmissionsData as GetGradingSubmissionsData,
  ExamGradingSubmissionReponse as GradingSubmissionReponse,
  examGetGradingSubmissions as getGradingSubmissions,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { calculateReverseIndex, formatDatetimeLocale, toFixedHuman } from '@/helper/util';
import { channelState, userState } from '@/store';


export const Displays = () => {
  const { t } = useTranslation('exam');
  const user = useAtomValue(userState);
  const channel = useAtomValue(channelState);

  // redirect 401
  if (!user || user.username !== channel?.owner.username) return <Navigate to="/error/401" replace />;

  return (
    <GridInfiniteScrollPage<GradingSubmissionReponse, GetGradingSubmissionsData>
      pageKey="examgrading"
      orderingOptions={[
        { value: 'end_time', label: t('Exam end') },
        { value: 'start_time', label: t('Exam start') },
      ]}
      apiService={getGradingSubmissions}
      renderItem={({ data }) => (
        <TableContainer>
          <Table sx={{ '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">no</TableCell>
                <TableCell>{t('Learner')}</TableCell>
                <TableCell>{t('Exam title')}</TableCell>
                <TableCell>{t('Kind')}</TableCell>
                <TableCell>{t('Exam end time')}</TableCell>
                <TableCell>{t('Score')}</TableCell>
                <TableCell>{t('Status')}</TableCell>
                <TableCell>{t('Graded time')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((pagination, pageIndex) =>
                pagination.items?.map((row, rowIndex) => (
                  <GradingRow
                    key={row.id}
                    row={row}
                    index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)}
                  />
                )),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      emptyMessage={<EmptyMessage Icon={Grading} message={t('No exam submissions found.')} />}
      gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
    />
  );
};

const GradingRow = ({ row, index }: { row: GradingSubmissionReponse; index: number }) => {
  const { t } = useTranslation('exam');
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);

  return (
    <TableRow
      onClick={() => setGradingDialogOpen(true)}
      key={row.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{index}</TableCell>
      <TableCell>
        <WithAvatar variant="small" {...row.user} />
      </TableCell>
      <TableCell>{row.exam.title}</TableCell>
      <TableCell>{t(row.exam.sub_kind)}</TableCell>
      <TableCell>{formatDatetimeLocale(row.end_time)}</TableCell>
      <TableCell>{toFixedHuman(row.score, 1)}</TableCell>
      <TableCell>{t(row.status || '')}</TableCell>
      <TableCell>{row.graded_time && formatDatetimeLocale(row.graded_time)}</TableCell>
      {gradingDialogOpen && (
        <ViewDialog open={gradingDialogOpen} setOpen={setGradingDialogOpen} id={row.exam.id} userId={row.user.id} />
      )}
    </TableRow>
  );
};
