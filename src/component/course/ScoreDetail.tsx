import { HelpOutlineOutlined } from '@mui/icons-material';
import {
  Badge,
  Box,
  ClickAwayListener,
  IconButton,
  Paper,
  Popper,
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
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseDisplayResponse, LessonDisplayResponse } from '@/api';
import { toFixedHuman } from '@/helper/util';

interface Props {
  course: CourseDisplayResponse;
  lessons?: LessonDisplayResponse[];
  sx?: SxProps;
}

export const ScoreDetail = ({ course, lessons, sx }: Props) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const progress = course.progress ?? 0;
  const score = course.score ?? 0;

  const stats = useMemo(() => {
    if (!lessons?.length) {
      return { lessons: [], totalWeight: 0, calcProgress: '', calcScore: '' };
    }
    return textStats(progress, score, lessons, t);
  }, [lessons, progress, score, t]);

  const {
    learning_start: learningStart,
    learning_end: learningEnd,
    cutoff_progress: cutoffProgress,
    cutoff_score: cutoffScore,
  } = course;

  if (!learningStart || !learningEnd) return null;

  return (
    <>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(anchorEl ? null : e.currentTarget);
        }}
        sx={sx}
      >
        <HelpOutlineOutlined />
      </IconButton>

      <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} sx={{ zIndex: theme.zIndex.drawer + 101 }}>
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
              overflow: 'auto',
              maxWidth: 'calc(100vw - 1em)',
              mx: { xs: 1, md: 3 },
              mt: 1,
              gap: 4,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('Completion requirements for this course')}
              </Typography>
              <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, m: 0, pl: 3 }}>
                <Typography component="li" variant="body2">
                  {t('Progress must be {{cutoff}}% or higher.', { cutoff: cutoffProgress })}
                </Typography>
                <Typography component="li" variant="body2">
                  {t('Total score must be {{cutoff}} points or higher.', { cutoff: cutoffScore })}
                </Typography>
                <Typography component="li" variant="body2">
                  {t('All lessons within the course must be passed.')}
                </Typography>
              </Box>
            </Box>

            {course.certificate_templates.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {t('Certificate issuance')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.primary' }}>
                  {t('You can request a certificate after completing the requirements for this course.')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {course.certificate_templates.map((template) => (
                    <Box key={template.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Paper
                        elevation={3}
                        component="img"
                        src={template.thumbnail}
                        sx={{ maxHeight: '120px', height: '120px', width: 'auto', borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('Calculation method & Current score')}
              </Typography>
              <Box
                sx={{
                  bgcolor: 'action.hover',
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
                <Typography variant="body2">{t('Total Score = {{calcScore}}', { calcScore: stats.calcScore })}</Typography>
              </Box>
            </Box>

            <TableContainer sx={{ overflow: 'unset' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('Detailed breakdown of the weighted score')}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'background.default' } }}>
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
                    <TableRow key={lesson.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        {lesson.title}
                        {lesson.method === 'score' && (
                          <Tooltip title={t('Exam')} placement="top">
                            <Badge variant="dot" color="info" />
                          </Tooltip>
                        )}
                      </TableCell>
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
    </>
  );
};

type GradingMethod = 'progress' | 'score' | 'none';

interface LessonStats {
  id: string;
  title: string;
  weight: number;
  method: GradingMethod;
  progress: number;
  score: number;
}

interface Stats {
  lessons: LessonStats[];
  totalWeight: number;
  calcProgress: string;
  calcScore: string;
}

const textStats = (
  progress: number,
  score: number,
  lessons: LessonDisplayResponse[] | undefined,
  t: (key: string, options?: Record<string, string | number>) => string,
): Stats => {
  if (!lessons?.length) return { lessons: [], totalWeight: 0, calcProgress: '', calcScore: '' };

  const result = lessons.reduce(
    (acc, lesson) => {
      const { grading_method, passed, title } = lesson;
      const weight = lesson.weight ?? 0;
      const progress = lesson.progress ?? 0;
      const score = lesson.score ?? 0;

      acc.lessons.push({ id: lesson.id, title, weight, method: grading_method, progress, score });

      if (grading_method === 'progress') {
        acc.progressCount++;
        if (passed) acc.progressPassed++;
      }

      if (weight > 0) {
        acc.totalWeight += weight;
      }

      return acc;
    },
    {
      progressPassed: 0,
      progressCount: 0,
      totalWeight: 0,
      lessons: [] as LessonStats[],
    },
  );

  return {
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
          .join(' + ') + ` = ${t('{{ value }} points', { value: toFixedHuman(score, 1) })}`,
  };
};
