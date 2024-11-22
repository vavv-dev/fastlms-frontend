import { ArrowDropDown, Close, Tour } from '@mui/icons-material';
import {
  Box,
  ClickAwayListener,
  IconButton,
  LinearProgress,
  Paper,
  Popper,
  Skeleton,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useSetAtom } from 'jotai';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { certificateStatusFamily } from '.';

import { CourseDisplayResponse, LessonDisplayResponse } from '@/api';
import { formatYYYMMDD, toFixedHuman } from '@/helper/util';

interface Props {
  course: CourseDisplayResponse;
  lessons?: LessonDisplayResponse[];
  sx?: SxProps;
}

export const WeightedScore = ({ course, lessons, sx }: Props) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const setCertificateStatus = useSetAtom(certificateStatusFamily(course.id));

  const [isCalculating, setIsCalculating] = useState(true);

  const stats = useMemo(() => {
    if (!lessons?.length) {
      return { progress: 0, score: 0, lessons: [], totalWeight: 0, calcProgress: '', calcScore: '' };
    }

    return calculateStats(lessons, t);
  }, [lessons, t]);

  useEffect(() => {
    if (!lessons?.length) {
      setIsCalculating(true);
      return;
    }

    const timer = requestAnimationFrame(() => {
      setIsCalculating(false);
    });

    return () => cancelAnimationFrame(timer);
  }, [lessons]);

  const { progress, score } = stats;

  useEffect(() => {
    if (course.certificates.length > 0) {
      setCertificateStatus('issued');
      return;
    } else if (course.certificate_enabled) {
      if (progress >= course.cutoff_progress && score >= course.cutoff_score) {
        setCertificateStatus('eligible');
        return;
      }
    }
  }, [progress, score, course, setCertificateStatus]);

  useEffect(() => {
    const updateWidth = debounce(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    }, 100);

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      updateWidth.cancel();
    };
  }, []);

  const labelPosition = useMemo(() => {
    if (!containerWidth) return 'right';
    const threshold = containerWidth <= 400 ? 70 : containerWidth <= 500 ? 80 : 85;
    return progress >= threshold ? 'left' : 'right';
  }, [containerWidth, progress]);

  const { study_start: studyStart, study_end: studyEnd, cutoff_progress: cutoffProgress, cutoff_score: cutoffScore } = course;
  if (!studyStart || !studyEnd) return null;

  const start = new Date(studyStart);
  const end = new Date(studyEnd);
  const today = new Date();
  const totalDuration = end.getTime() - start.getTime();
  const elapsedTime = today.getTime() - start.getTime();
  const remainDays = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const elapsed = Math.min(Math.max((elapsedTime / totalDuration) * 100, 0), 100);
  const isBeforeStart = today < start;
  const isAfterEnd = today > end;

  const progressColor = progress >= cutoffProgress ? 'success.main' : 'warning.main';
  const scoreColor = score >= cutoffScore ? 'success.main' : 'warning.main';

  const labelStyle =
    labelPosition === 'right' ? { left: `calc(${progress}% + 20px)` } : { right: `calc(${100 - progress}% + 20px)` };

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', md: 600 },
        position: 'relative',
        ...sx,
      }}
    >
      {isCalculating ? (
        <WeightedScoreSkeleton />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tour sx={{ color: progressColor, position: 'absolute', top: 0, left: `calc(${progress}% - 6px)`, zIndex: 2 }} />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              ...labelStyle,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              '& *': { whiteSpace: 'nowrap' },
              zIndex: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: progressColor }}>
              {t('Progress {{ value }}%', { value: toFixedHuman(progress, 1) })}
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', height: '1em' }}>
            {!isBeforeStart && !isAfterEnd && (
              <Tooltip title={t('Today. Remain {{ value }} days.', { value: remainDays })}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${elapsed}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    p: 0.5,
                    boxShadow: 4,
                    zIndex: 1,
                    opacity: 0.9,
                  }}
                />
              </Tooltip>
            )}
            <LinearProgress
              color={progress >= cutoffProgress ? 'success' : 'warning'}
              variant="determinate"
              value={Math.max(Math.min(progress, 100), 0)}
              sx={{
                height: 8,
                width: '100%',
                borderRadius: '4px',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              {t('Start')} {formatYYYMMDD(start)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: scoreColor, display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(anchorEl ? null : e.currentTarget);
              }}
            >
              {t('Total score {{ value }} points', { value: toFixedHuman(score, 1) })}
              <ArrowDropDown fontSize="small" />
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('End')} {formatYYYMMDD(end)}
            </Typography>
          </Box>
          <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
              <Paper
                elevation={8}
                sx={{
                  borderRadius: 2,
                  position: 'relative',
                  maxHeight: 'calc(100vh - 300px)',
                  minHeight: 300,
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 2, sm: 3 },
                  gap: 3,
                  overflow: 'auto',
                  maxWidth: 'calc(100vw - 1em)',
                  mx: 1,
                }}
              >
                <IconButton onClick={() => setAnchorEl(null)} sx={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <Close fontSize="small" />
                </IconButton>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {t('Calculation Method')}
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: 'action.hover',
                      p: 2,
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {t('Progress = {{calcProgress}}%', { calcProgress: stats.calcProgress })}
                    </Typography>
                    <Typography variant="body2">
                      {t('Total Score = {{calcScore}} = {{finalScore}} points', {
                        calcScore: stats.calcScore,
                        finalScore: toFixedHuman(stats.score, 1),
                      })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {t('Completion Requirements')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {t('Progress must be {{cutoff}}% or higher.', { cutoff: cutoffProgress })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {t('Total score must be {{cutoff}} points or higher.', { cutoff: cutoffScore })}
                    </Typography>
                  </Box>
                </Box>

                <TableContainer sx={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'unset' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {t('Lessons with weighted score')}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: 'background.default' } }}>
                        <TableCell>No.</TableCell>
                        <TableCell>{t('Lesson')}</TableCell>
                        <TableCell align="right">{t('Type')}</TableCell>
                        <TableCell align="right">{t('Score')}</TableCell>
                        <TableCell align="right">{t('Weight')}</TableCell>
                        <TableCell align="right">{t('Weighted Score')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.lessons.map((lesson, i) => (
                        <TableRow key={lesson.title} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{lesson.title}</TableCell>
                          <TableCell align="right">{lesson.method === 'progress' ? t('Progress') : t('Score')}</TableCell>
                          <TableCell align="right">
                            {`${toFixedHuman(lesson.method === 'progress' ? Math.min(lesson.progress, 100) : lesson.score, 1)}%`}
                          </TableCell>
                          <TableCell align="right">
                            {lesson.weight === 0 ? '0.0%' : `${toFixedHuman((lesson.weight / stats.totalWeight) * 100, 1)}%`}
                          </TableCell>
                          <TableCell align="right">
                            {`${toFixedHuman(
                              lesson.weight === 0
                                ? 0
                                : (lesson.method === 'progress' ? Math.min(lesson.progress, 100) : lesson.score) *
                                    (lesson.weight / stats.totalWeight),
                              1,
                            )}%`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </ClickAwayListener>
          </Popper>
        </Box>
      )}
    </Box>
  );
};

type GradingMethod = 'progress' | 'score' | 'none';

interface LessonStats {
  title: string;
  weight: number;
  method: GradingMethod;
  progress: number;
  score: number;
}

interface Stats {
  progress: number;
  score: number;
  lessons: LessonStats[];
  totalWeight: number;
  calcProgress: string;
  calcScore: string;
}

const calculateStats = (
  lessons: LessonDisplayResponse[] | undefined,
  t: (key: string, options?: Record<string, string | number>) => string,
): Stats => {
  if (!lessons?.length) return { progress: 0, score: 0, lessons: [], totalWeight: 0, calcProgress: '', calcScore: '' };

  const result = lessons.reduce(
    (acc, lesson) => {
      const { grading_method, passed, title } = lesson;
      const weight = lesson.weight ?? 0;
      const progress = lesson.progress ?? 0;
      const score = lesson.score ?? 0;

      acc.lessons.push({ title, weight, method: grading_method, progress, score });

      if (grading_method === 'progress') {
        acc.progressCount++;
        if (passed) acc.progressPassed++;
      }

      if (weight > 0) {
        acc.totalWeight += weight;
        acc.totalScore += (weight / 100) * (grading_method === 'progress' ? progress : score);
      }

      return acc;
    },
    {
      progressPassed: 0,
      progressCount: 0,
      totalScore: 0,
      totalWeight: 0,
      lessons: [] as LessonStats[],
    },
  );

  const progress = result.progressCount ? (result.progressPassed / result.progressCount) * 100 : 0;
  const score = result.totalWeight ? (result.totalScore / result.totalWeight) * 100 : 0;

  return {
    progress,
    score,
    lessons: result.lessons,
    totalWeight: result.totalWeight,
    calcProgress: `${result.progressPassed}(${t('completed lessons')}) ÷ ${result.progressCount}(${t('all lessons')}) × 100 = ${toFixedHuman(progress, 1)}`,
    calcScore: !result.lessons.filter((l) => l.weight > 0).length
      ? t('No lessons with weight')
      : result.lessons
          .filter((l) => l.weight > 0)
          .map(
            (l) =>
              `${toFixedHuman(l.method === 'progress' ? l.progress : l.score, 1)}% × ${toFixedHuman((l.weight / result.totalWeight) * 100, 1)}%`,
          )
          .join(' + '),
  };
};

const WeightedScoreSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Progress Bar and Marker */}
      <Box sx={{ position: 'relative', height: '1em' }}>
        <Skeleton variant="rectangular" sx={{ height: 8, width: '100%', borderRadius: '4px' }} />
      </Box>

      {/* Bottom Date Range and Score */}
      <Box sx={{ height: '20px', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
        <Skeleton variant="text" width={120} sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Skeleton variant="text" width={100} />
        <Skeleton variant="text" width={120} />
      </Box>
    </Box>
  );
};
