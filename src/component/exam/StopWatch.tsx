import { Box, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Message } from './Message';

import {
  ExamAttemptResponse as AttemptResponse,
  ExamDisplayResponse as DisplayResponse,
  ExamGetAttemptData as GetAttemptData,
  examGetAttempt as getAttempt,
  examGetDisplays as getDisplays,
  examStartAttempt as startAttempt,
  examSubmitAttempt as submitAttempt,
} from '@/api';
import { updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { alertState, snackbarMessageState } from '@/component/layout';
import { formatDuration } from '@/helper/util';

interface Props {
  id: string;
  getValues: (name: string) => Array<{ id: number; answer: string }>;
}

export const StopWatch = ({ id, getValues }: Props) => {
  const { t } = useTranslation('exam');
  const { data, mutate } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });
  const [remainSeconds, setRemainSeconds] = useState<number>(0);
  const navigate = useNavigate();
  const setAlert = useSetAtom(alertState);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const submission = data?.submission;
  const startAttemptCalled = useRef(false);

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

  const alertMessage = useMemo(
    () => (!data ? null : <Message id={data.id} title={data.title} context={data.submission?.context} />),
    [data],
  );

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
    if (!submission.start_time && !startAttemptCalled.current) {
      startAttemptCalled.current = true;
      startAttempt({
        id: id,
        requestBody: {
          // real time
          start_time: String(new Date(start).getTime() / 1000),
        },
      })
        .then((updated) => {
          updateInfiniteCache<DisplayResponse>(getDisplays, updated, 'update');
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
    // clean up
    return () => {
      if (!data || !data.duration || !submission || submission.end_time) return;
      // set global alert
      setAlert({ open: false, message: '', severity: 'info' });
      if (!submission.end_time && data.duration) {
        const start = submission.start_time ? new Date(submission.start_time).getTime() : new Date().getTime();
        const remain = Math.ceil((start + data.duration * 60 * 1000 - new Date().getTime()) / 1000);
        if (remain > 0) {
          setAlert({ open: true, message: alertMessage, severity: 'warning', duration: remain * 1000 });
        }
      }
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!data || !data.duration || !submission || submission.end_time) return;
    if (remainSeconds <= -1) {
      // force submit
      submitAttempt({
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

  return null;
};
