import { ExamAssessResponse, ExamGetAssessData, examGetAssess, examStartAssess, examSubmitAssess } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { alertState, snackbarMessageState } from '@/component/layout';
import { formatDuration } from '@/helper/util';
import { KeyboardArrowRight } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface StopWatchProps {
  examId: string;
  getValues: (name: string) => Array<{ id: number; answer: string }>;
}

const StopWatch = ({ examId, getValues }: StopWatchProps) => {
  const { t } = useTranslation('exam');
  const { data: exam, mutate } = useServiceImmutable<ExamGetAssessData, ExamAssessResponse>(examGetAssess, { id: examId });
  const [remainSeconds, setRemainSeconds] = useState<number>(0);
  const navigate = useNavigate();
  const pathnameRef = useRef<string>(window.location.pathname);
  const setAlert = useSetAtom(alertState);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const submission = exam?.submission;

  const createMessage = useMemo(() => {
    return (title: string, duration: number, remain: number, severity: string) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2">{title}</Typography>
        <Typography variant="body2">{`${t('Exam time')} ${formatDuration(remain)} / ${formatDuration(duration)}`}</Typography>
        {severity === 'warning' && (
          <Typography variant="body2">{t('Check your answers and submit before time runs out.')}</Typography>
        )}
      </Box>
    );
  }, [t]);

  const globalExamAlert = useMemo(() => {
    return (id: string, title: string) => (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
        onClick={() => navigate(`/exam/${id}/assess`)}
        style={{ cursor: 'pointer' }}
      >
        <Typography variant="body2">{title}</Typography>
        <Typography variant="body2">{`${t('Exam is in progress.')}`}</Typography>
        <KeyboardArrowRight fontSize="small" />
      </Box>
    );
  }, [t, navigate]);

  useEffect(() => {
    if (!exam || !exam.duration || !submission || submission.end_time) return;
    const start = submission.start_time ? new Date(submission.start_time).getTime() : new Date().getTime();

    const updateWatch = () => {
      if (!exam.duration) return;
      const duration = exam.duration * 60; // minutes to seconds
      const remain = Math.ceil((start + duration * 1000 - new Date().getTime()) / 1000);
      if (remain < -1) clearInterval(interval);
      setRemainSeconds(remain);

      // update alert
      if (remain >= 0) {
        const severity = remain / 60 < 5 ? 'warning' : 'info';
        const message = createMessage(exam.title, duration, remain, severity);
        setAlert({ open: true, message: message, severity: severity, hideClose: true, duration: 2000 });
      }
    };

    const interval = setInterval(updateWatch, 1000);
    updateWatch();

    // save client start time
    if (!submission.start_time) {
      examStartAssess({
        id: examId,
        requestBody: {
          // real exam time
          start_time: String(new Date(start).getTime() / 1000),
        },
      })
        .then((updated) => {
          mutate(updated, { revalidate: false });
        })
        .catch(() => {
          setSnackbarMessage({ message: t('Unknow error occurred'), duration: 3000 });
          navigate(-1);
        });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [exam?.id]); // eslint-disable-line

  useEffect(() => {
    if (!exam || !exam.duration || !submission || submission.end_time) return;
    const pathnameRefVal = pathnameRef.current;
    return () => {
      // set global alert
      if (pathnameRefVal !== window.location.pathname) {
        if (!submission.end_time && exam.duration) {
          const start = submission.start_time ? new Date(submission.start_time).getTime() : new Date().getTime();
          const remain = Math.ceil((start + exam.duration * 60 * 1000 - new Date().getTime()) / 1000);
          if (remain > 0) {
            const message = globalExamAlert(exam.id, exam.title);
            setAlert({ open: true, message: message, severity: 'warning', duration: remain * 1000 });
          }
        }
      }
    };
  }, [pathnameRef.current]); // eslint-disable-line

  useEffect(() => {
    if (!exam || !exam.duration || !submission || submission.end_time) return;
    if (remainSeconds <= -1) {
      // force submit
      examSubmitAssess({
        id: examId,
        requestBody: {
          answers: getValues('answers')
            .filter((answer) => !!answer.answer)
            .reduce(
              (acc, cur) => {
                acc[String(cur.id)] = cur.answer;
                return acc;
              },
              {} as Record<string, string>,
            ),
        },
      }).then((updated) => {
        mutate(updated).then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      });
    }
  }, [remainSeconds]); // eslint-disable-line

  if (!exam || !exam.duration || !submission || submission.end_time) {
    return null;
  }

  // as JSX
  return null;
};

export default StopWatch;
