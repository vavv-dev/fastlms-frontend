import {
  ExamAssessResponse as AssessResponse,
  ExamGetAssessData as GetAssessData,
  examGetAssess as getAssess,
  examStartAssess as startAssess,
  examSubmitAssess as submitAssess,
} from '@/api';
import { useServiceImmutable } from '@/component/common';
import { alertState, snackbarMessageState } from '@/component/layout';
import { formatDuration } from '@/helper/util';
import { ArrowForwardOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { examMessageState } from '.';

interface Props {
  id: string;
  getValues: (name: string) => Array<{ id: number; answer: string }>;
}

export const StopWatch = ({ id, getValues }: Props) => {
  const { t } = useTranslation('exam');
  const { data, mutate } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id });
  const [remainSeconds, setRemainSeconds] = useState<number>(0);
  const navigate = useNavigate();
  const pathnameRef = useRef<string>(window.location.pathname);
  const setAlert = useSetAtom(alertState);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const submission = data?.submission;
  const setExamMessage = useSetAtom(examMessageState);

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

  const globalAlert = useMemo(() => {
    return (id: string, title: string) => (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
        onClick={() => navigate(`/exam/${id}`)}
        style={{ cursor: 'pointer' }}
      >
        <Typography variant="body2">{title}</Typography>
        <Typography variant="body2">{`${t('Exam is in progress.')}`}</Typography>
        <ArrowForwardOutlined fontSize="small" />
      </Box>
    );
  }, [t, navigate]);

  useEffect(() => {
    if (!data || !data.duration || !submission || submission.end_time) return;
    const start = submission.start_time ? new Date(submission.start_time).getTime() : new Date().getTime();

    const updateWatch = () => {
      if (!data.duration) return;
      const duration = data.duration * 60; // minutes to seconds
      const remain = Math.ceil((start + duration * 1000 - new Date().getTime()) / 1000);
      if (remain < -1) clearInterval(interval);
      setRemainSeconds(remain);

      // update alert
      if (remain >= 0) {
        const severity = remain / 60 < 5 ? 'warning' : 'info';
        const message = createMessage(data.title, duration, remain, severity);
        setAlert({ open: true, message: message, severity: severity, hideClose: true, duration: 2000 });
      }
    };

    const interval = setInterval(updateWatch, 1000);
    updateWatch();

    // save client start time
    if (!submission.start_time) {
      startAssess({
        id: id,
        requestBody: {
          // real time
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
  }, [data?.id]); // eslint-disable-line

  useEffect(() => {
    if (!data || !data.duration || !submission || submission.end_time) return;
    const pathnameRefVal = pathnameRef.current;
    return () => {
      // set global alert
      setExamMessage(null);
      if (pathnameRefVal !== window.location.pathname) {
        if (!submission.end_time && data.duration) {
          const start = submission.start_time ? new Date(submission.start_time).getTime() : new Date().getTime();
          const remain = Math.ceil((start + data.duration * 60 * 1000 - new Date().getTime()) / 1000);
          if (remain > 0) {
            const message = globalAlert(data.id, data.title);
            setAlert({ open: true, message: message, severity: 'warning', duration: remain * 1000 });
            setExamMessage(message);
          }
        }
      }
    };
  }, [pathnameRef.current]); // eslint-disable-line

  useEffect(() => {
    if (!data || !data.duration || !submission || submission.end_time) return;
    if (remainSeconds <= -1) {
      // force submit
      submitAssess({
        id: id,
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

  if (!data || !data.duration || !submission || submission.end_time) {
    return null;
  }

  // as JSX
  return null;
};
