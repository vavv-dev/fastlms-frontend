import { ArrowDropDown, ArrowDropUp, NotificationImportantOutlined, PlaylistPlayOutlined, Refresh } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  SxProps,
  Theme,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { StepIconProps } from '@mui/material/StepIcon';
import { useTheme } from '@mui/material/styles';
import { useAtom, useAtomValue } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { certificateStatusFamily } from '.';
import { ActionMenu } from './ActionMenu';
import { CertificateRequest } from './CertificateRequest';
import { EnrollDialog } from './EnrollDialog';
import { WeightedScore } from './WeightedScore';

import {
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  LessonDisplayResponse,
  LessonGetDisplaysData,
  LessonGetDisplaysResponse,
  courseGetView as getView,
  lessonGetDisplays,
} from '@/api';
import {
  EmptyMessage,
  GradientCircularProgress,
  WithAvatar,
  useInfinitePagination,
  useServiceImmutable,
} from '@/component/common';
import { spacerRefState } from '@/component/layout';
import { LessonCard } from '@/component/lesson';
import { textEllipsisCss, toFixedHuman } from '@/helper/util';

const activeStepFamily = atomFamily((id: string) => atomWithStorage<number>(`activeStep-${id}`, 0));

export const View = () => {
  const { t } = useTranslation('course');
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };
  const { data, mutate } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const {
    data: _lessons,
    mutate: lessonMutate,
    isLoading,
    isValidating,
  } = useInfinitePagination<LessonGetDisplaysData, LessonGetDisplaysResponse>({
    apiService: lessonGetDisplays,
    apiOptions: data?.enrolled ? { course: id } : {},
  });
  const [showAll, setShowAll] = useState(false);
  const [activeStep, setActiveStep] = useAtom(activeStepFamily(id));
  const spacerRef = useAtomValue(spacerRefState);
  const stickyPanelRef = useRef<HTMLDivElement>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const certificateStatus = useAtomValue(certificateStatusFamily(id));

  // update spacerRef height
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    if (location.state?.activeStep != undefined) {
      setActiveStep(location.state.activeStep);
      delete location.state.activeStep;
    }
  }, [location.state?.activeStep, setActiveStep]);

  // _lessons?.[0]?.items is all lessons with size 100 limit
  const lessons = _lessons?.[0]?.items || [];

  useEffect(() => {
    if (!data?.enrolled) setEnrollDialogOpen(true);
  }, [data?.enrolled, data, navigate]);

  useEffect(() => {
    if (data?.certificates.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [data?.certificates.length]);

  const refresh = () => {
    mutate();
    lessonMutate();
  };

  const openCoursePlayer = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.avatar-children .MuiButtonBase-root')) return;
    if (target.closest('.avatar-children .asset-upload')) return;

    const element = (e.target as HTMLElement).closest('[data-lesson-id][data-resource-id]');
    if (element) {
      e.preventDefault();
      e.stopPropagation();

      const lessonId = element.getAttribute('data-lesson-id');
      const resourceId = element.getAttribute('data-resource-id');
      if (lessonId && resourceId) {
        navigate(`/course/${id}/player`, { state: { resourceLocation: { lesson_id: lessonId, resource_id: resourceId } } });
      }
    }
  };

  if (!id || !data) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ m: 'auto', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ position: 'sticky', top: `${spacerRef?.clientHeight || 0}px`, bgcolor: 'background.paper', zIndex: 5 }}>
          <Typography
            variant="h5"
            sx={{ mx: 'auto', maxWidth: 'md', textAlign: 'center', ...(smDown && (textEllipsisCss(1) as SxProps)) }}
          >
            {data.title}
          </Typography>
        </Box>
        {!data.description && (
          <Typography
            variant="caption"
            sx={{ lineHeight: 1.5, color: 'text.secondary', whiteSpace: 'pre-wrap', maxWidth: 'sm', ...textEllipsisCss(1) }}
            className="tiptap-content"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        )}
        <WithAvatar variant="small" {...data.owner} sx={{ mx: 'auto' }} />

        {data.enrolled ? (
          <>
            <Box
              ref={stickyPanelRef}
              sx={{
                display: 'flex',
                position: 'sticky',
                top: `${(spacerRef?.clientHeight || 0) + 32}px`,
                bgcolor: 'background.paper',
                zIndex: 5,
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                borderBottom: 1,
                py: 2,
                borderColor: 'divider',
                gap: { xs: 2, md: 5 },
              }}
            >
              <WeightedScore course={data} lessons={lessons} sx={{ pt: 3 }} />
              {certificateStatus != 'issued' && <CertificateRequest course={data} />}

              <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/course/${id}/player`)}
                  sx={{ whiteSpace: 'nowrap' }}
                  startIcon={<PlaylistPlayOutlined />}
                >
                  {data.resource_location ? t('Resume') : t('Start learning')}
                </Button>
                {!smDown && (
                  <IconButton color="primary" onClick={() => setShowAll(!showAll)}>
                    {showAll ? <ArrowDropDown /> : <ArrowDropUp />}
                  </IconButton>
                )}
                <IconButton color="primary" onClick={refresh}>
                  <Refresh />
                </IconButton>
                <ActionMenu data={data} />
              </Box>
            </Box>
            <Box sx={{ position: 'relative', mt: 3 }} onClickCapture={(e) => openCoursePlayer(e)}>
              {(isLoading || isValidating) && (
                <Box sx={{ position: 'absolute', width: '100%', textAlign: 'center', top: '2em' }}>
                  <GradientCircularProgress />
                </Box>
              )}
              {certificateStatus == 'issued' && <CertificateRequest course={data} />}
              <Stepper
                nonLinear
                activeStep={activeStep}
                orientation="vertical"
                sx={{ '& .MuiStepConnector-line': { minHeight: '12px' } }}
              >
                {lessons?.map((lesson, i) => (
                  <LessonStep
                    key={i}
                    lesson={lesson}
                    stepIndex={i}
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    showAll={showAll}
                  />
                ))}
              </Stepper>
            </Box>
          </>
        ) : (
          <EmptyMessage Icon={NotificationImportantOutlined} message={t('You are not enrolled in this course')} />
        )}
      </Box>
      {enrollDialogOpen && <EnrollDialog open={enrollDialogOpen} setOpen={setEnrollDialogOpen} id={data.id} />}
    </Box>
  );
};

interface LessonStepProps {
  lesson: LessonDisplayResponse;
  stepIndex: number;
  activeStep: number;
  setActiveStep: (value: number | ((prev: number) => number)) => void;
  showAll: boolean;
}

const LessonStep = ({ lesson, stepIndex, activeStep, setActiveStep, showAll, ...props }: LessonStepProps) => {
  const { t } = useTranslation('course');
  const [, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepIndex != activeStep) setActive(showAll);
  }, [showAll, stepIndex, activeStep]);

  useEffect(() => {
    const newActive = stepIndex == activeStep;
    setActive(newActive);
  }, [stepIndex, activeStep]);

  return (
    <Step
      ref={stepRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      active={active || activeStep == stepIndex}
      completed={!!lesson.passed}
      sx={{ '& .Mui-completed .MuiSvgIcon-root': { color: 'success.main' } }}
      key={stepIndex}
      {...props}
    >
      <StepLabel
        onClick={() => {
          setActiveStep((prev) => (prev == stepIndex ? -1 : stepIndex));
          setActive((prev) => !prev);
        }}
        sx={{
          gap: 2,
          cursor: 'pointer',
          minHeight: '2em',
          '& .MuiStepLabel-label': { display: 'flex', gap: 3, alignItems: 'center' },
        }}
        slots={{
          stepIcon: lesson.grading_method === 'none' ? NoGradingStepIcon : undefined,
        }}
      >
        <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
          {lesson.title}
        </Typography>
        {!!lesson.score && (
          <Typography variant="subtitle2" color={lesson.passed ? 'success' : 'warning'}>
            {t('Score {{ value }}', { value: toFixedHuman(lesson.score, 1) })}
          </Typography>
        )}
        {!!lesson.progress && (
          <Typography variant="subtitle2" color={lesson.passed ? 'success' : 'warning'}>
            {t('Progress {{ value }}%', { value: toFixedHuman(lesson.progress, 1) })}
          </Typography>
        )}
        {lesson.resource_displays.some((resource) => 'status' in resource && resource.status === 'grading') && (
          <Typography variant="subtitle2" color="error">
            {t('Grading')}
          </Typography>
        )}
      </StepLabel>
      <StepContent>
        <LessonCard data={lesson} embeded hideAvatar />
      </StepContent>
    </Step>
  );
};

const NoGradingStepIcon = (props: StepIconProps) => {
  const theme = useTheme();
  const { active, completed, error, icon } = props;

  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '1px solid',
    borderColor: error
      ? theme.palette.error.main
      : completed
        ? theme.palette.primary.main
        : active
          ? theme.palette.primary.main
          : theme.palette.grey[400],
    backgroundColor: 'transparent',
    color: error
      ? theme.palette.error.main
      : completed
        ? theme.palette.primary.main
        : active
          ? theme.palette.primary.main
          : theme.palette.grey[600],
    fontSize: '0.875rem',
    fontWeight: 500,
  };

  return <div style={style}>{icon}</div>;
};
