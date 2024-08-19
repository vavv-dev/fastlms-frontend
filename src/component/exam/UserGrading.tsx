import { ExamGetGradingSubmissionsData, ExamGradingSubmissionReponse, examGetGradingSubmissions } from '@/api';
import { GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { formatDatetimeLocale, toFixedHuman } from '@/helper/util';
import { homeUserState, userState } from '@/store';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import GradingDialog from './GradingDialog';

const UserGrading = () => {
  const { t } = useTranslation('exam');
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);

  // redirect 401
  if (!user || user.username !== homeUser?.username) return <Navigate to="/error/401" replace />;

  return (
    <>
      <GridInfiniteScrollPage<ExamGradingSubmissionReponse, ExamGetGradingSubmissionsData>
        pageKey="examgrading"
        orderingOptions={[
          { value: 'end_time', label: t('Exam end desc') },
          { value: 'start_time', label: t('Exam start desc') },
        ]}
        apiService={examGetGradingSubmissions}
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
                {data?.map((pagination) =>
                  pagination.items?.map((row, i) => (
                    <ExamGradingRow
                      key={row.id}
                      row={row}
                      line={pagination.total - (pagination.page - 1) * pagination.size - i}
                    />
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
      />
    </>
  );
};

export default UserGrading;

const ExamGradingRow = ({ row, line }: { row: ExamGradingSubmissionReponse; line: number }) => {
  const { t } = useTranslation('exam');
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);

  return (
    <TableRow
      onClick={() => setGradingDialogOpen(true)}
      key={row.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{line}</TableCell>
      <TableCell>
        <WithAvatar variant="small" {...row.user} />
      </TableCell>
      <TableCell>{row.exam.title}</TableCell>
      <TableCell>{t(row.exam.exam_kind)}</TableCell>
      <TableCell>{formatDatetimeLocale(row.end_time)}</TableCell>
      <TableCell>{toFixedHuman(row.score, 1)}</TableCell>
      <TableCell>{t(row.status || '')}</TableCell>
      <TableCell>{row.graded_time && formatDatetimeLocale(row.graded_time)}</TableCell>
      {gradingDialogOpen && (
        <GradingDialog open={gradingDialogOpen} setOpen={setGradingDialogOpen} examId={row.exam.id} userId={row.user.id} />
      )}
    </TableRow>
  );
};
