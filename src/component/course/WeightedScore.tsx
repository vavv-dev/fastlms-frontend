import { Tour } from '@mui/icons-material';
import { Box, LinearProgress, Skeleton, SxProps, Tooltip, Typography } from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ScoreDetail } from './ScoreDetail';

import { CourseDisplayResponse, LessonDisplayResponse } from '@/api';
import { formatYYYMMDD, toFixedHuman } from '@/helper/util';

interface Props {
  course: CourseDisplayResponse;
  lessons?: LessonDisplayResponse[];
  sx?: SxProps;
}

export const WeightedScore = ({ course, lessons, sx }: Props) => {
  const { t } = useTranslation('course');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const shouldShowSkeleton = !lessons?.length;
  const progress = course.progress ?? 0;
  const score = course.score ?? 0;

  useEffect(() => {
    const updateWidth = debounce(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    }, 10);

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      updateWidth.cancel();
      resizeObserver.disconnect();
    };
  }, []);

  const labelPosition = useMemo(() => {
    if (!containerWidth) return 'right';
    const threshold = containerWidth <= 400 ? 70 : containerWidth <= 500 ? 80 : 85;
    return progress >= threshold ? 'left' : 'right';
  }, [containerWidth, progress]);

  const { learning_start: learningStart, learning_end: learningEnd, cutoff_progress: cutoffProgress } = course;
  if (!learningStart || !learningEnd) return null;

  const start = new Date(learningStart);
  const end = new Date(learningEnd);
  const today = new Date();
  const totalDuration = end.getTime() - start.getTime();
  const elapsedTime = today.getTime() - start.getTime();
  const remainDays = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const elapsed = Math.min(Math.max((elapsedTime / totalDuration) * 100, 0), 100);
  const isBeforeStart = today < start;
  const isAfterEnd = today > end;

  const progressColor = progress >= cutoffProgress ? 'success.main' : 'warning.main';
  const scoreColor = course.passed ? 'success.main' : 'warning.main';

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
      {shouldShowSkeleton ? (
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
            <Typography variant="body2" sx={{ color: scoreColor, display: 'flex', alignItems: 'center', gap: 1 }}>
              {t('Total score {{ value }} points', { value: toFixedHuman(score, 1) })}

              <ScoreDetail
                course={course}
                lessons={lessons}
                sx={{ ml: 1, p: 0, color: scoreColor, '& .MuiSvgIcon-root': { fontSize: '1.3rem' } }}
              />
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('End')} {formatYYYMMDD(end)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
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
