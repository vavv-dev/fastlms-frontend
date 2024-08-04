import { ExamDisplayResponse } from '@/api';
import { CommentDialog } from '@/component/comment';
import ResourceCard from '@/component/common/ResourceCard';
import { formatDatetimeLocale, formatDuration, formatRelativeTime } from '@/helper/util';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableRow, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ExamActionMenu from './ExamActionMenu';
import ExamReadyDialog from './ExamReadyDialog';
import GradingNotificationDialog from './GradingNotificationDialog';

interface Props {
  exam: ExamDisplayResponse;
  hideAvatar?: boolean;
}

const ExamCard = ({ exam, hideAvatar }: Props) => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();
  const [readyDialogOpen, setReadyDialogOpen] = useState(false);
  const [gradingNotificationOpen, setGradingNotificationOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    switch (exam.status) {
      case null:
        setReadyDialogOpen(true);
        break;
      case 'grading':
        setGradingNotificationOpen(true);
        break;
      case 'ready':
      case 'in_progress':
      case 'timeout':
      case 'failed':
      case 'passed':
        navigate(`/exam/${exam.id}/assess`);
        break;
    }
  };

  return (
    <>
      <ResourceCard
        resource={exam}
        onClick={onClick}
        banner={
          <Box sx={{ p: 2, position: 'relative' }}>
            <ExamInfo exam={exam} />
          </Box>
        }
        bannerPlace="bottom"
        score={exam.score}
        passed={exam.status === 'passed'}
        avatarChildren={[
          t(...formatRelativeTime(exam.modified)),
          t('{{ count }} submissions', { count: exam.submission_count }),
        ]}
        hideAvatar={hideAvatar}
        footer={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setCommentDialogOpen((prev) => !prev);
              }}
            >
              {t('Q&A')}
            </Button>
            {![null, 'passed', 'failed'].includes(exam.status) && (
              <Typography
                fontSize="small"
                component="span"
                variant="subtitle2"
                sx={{ fontWeight: 600, mx: 0.5, color: 'success.main' }}
              >
                {t(exam.status || '')}
              </Typography>
            )}
          </Box>
        }
        autoColor
        actionMenu={<ExamActionMenu exam={exam} />}
      />
      {readyDialogOpen && <ExamReadyDialog open={readyDialogOpen} setOpen={setReadyDialogOpen} exam={exam} />}
      {gradingNotificationOpen && (
        <GradingNotificationDialog open={gradingNotificationOpen} setOpen={setGradingNotificationOpen} exam={exam} />
      )}
      {commentDialogOpen && (
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
      )}
    </>
  );
};

export default ExamCard;

const ExamInfo = ({ exam }: { exam: ExamDisplayResponse }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();

  return (
    <TableContainer
      sx={{
        '& tr:first-of-type td': { fontWeight: 600 },
        '& td': { px: '.5em', fontSize: theme.typography.body2, whiteSpace: 'nowrap' },
        '& tr:last-child td': { borderBottom: 'none' },
      }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>{t('Exam Type')}</TableCell>
            <TableCell>{t(exam.exam_kind)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Start')}</TableCell>
            <TableCell>{formatDatetimeLocale(exam.start_date)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('End')}</TableCell>
            <TableCell>{exam.end_date ? formatDatetimeLocale(exam.end_date) : t('N/A')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Exam time')}</TableCell>
            <TableCell>{exam.duration ? formatDuration(exam.duration) : t('N/A')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Cutoff %')}</TableCell>
            <TableCell>{exam.cutoff_percent} %</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ verticalAlign: 'top' }}>{t('Questions')}</TableCell>
            <TableCell sx={{ verticalAlign: 'top', whiteSpace: 'pre !important' }}>
              {Object.entries(exam.question_composition)
                .filter(([, v]) => v)
                .reduce((acc, [key, value]) => {
                  acc.push(`${t(key)}: ${value}`);
                  return acc;
                }, [] as string[])
                .join('\n\r')}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
