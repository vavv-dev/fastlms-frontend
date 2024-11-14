import { ArrowDropDown, ArrowDropUp, NotificationImportantOutlined, Refresh } from '@mui/icons-material';
import {
  Box,
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
import { useAtom, useAtomValue } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';
import { EnrollDialog } from './EnrollDialog';

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
  const { id } = useParams();
  const { data, mutate } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id || '' });
  const {
    data: lessons,
    mutate: lessonMutate,
    isLoading,
    isValidating,
  } = useInfinitePagination<LessonGetDisplaysData, LessonGetDisplaysResponse>({
    apiService: lessonGetDisplays,
    apiOptions: data?.enrolled ? { course: id, size: 100 } : {},
  });
  const [showAll, setShowAll] = useState(false);
  const [activeStep, setActiveStep] = useAtom(activeStepFamily(id as string));
  const spacerRef = useAtomValue(spacerRefState);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  // update spacerRef height
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    if (location.state?.activeStep != undefined) {
      setActiveStep(location.state.activeStep);
      delete location.state.activeStep;
    }
  }, [location.state?.activeStep, setActiveStep]);

  useEffect(() => {
    if (!data?.enrolled) setEnrollDialogOpen(true);
  }, [data?.enrolled, data, navigate]);

  const refresh = () => {
    mutate();
    lessonMutate();
  };

  const totalStats = useMemo(() => {
    if (!lessons) return;
    let passed = 0;
    let total = 0;
    lessons?.forEach((lesson) => {
      lesson.items.forEach((item) => {
        if (item.grading_method == 'progress') {
          total += 1;
          if (item.passed) passed += 1;
        }
      });
    });

    if (total == 0) return null;
    return (
      <Typography variant="subtitle1" sx={{ color: data?.passed ? 'success.main' : 'warning.main', display: 'flex', gap: 2 }}>
        <span>{t('Total progress')}:</span> {`${toFixedHuman((passed / total) * 100, 1)} % (${passed} / ${total})`}
      </Typography>
    );
  }, [lessons, data, t]);

  if (!id || !data) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ m: 'auto', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          variant="h5"
          sx={{
            position: 'sticky',
            top: spacerRef?.clientHeight,
            bgcolor: 'background.paper',
            gap: 1,
            alignItems: 'center',
            zIndex: 5,
            textAlign: 'center',
            ...(smDown && (textEllipsisCss(1) as SxProps)),
          }}
        >
          {data.title}
        </Typography>
        {!data.description && (
          <Typography
            variant="caption"
            sx={{ lineHeight: 1.5, color: 'text.secondary', whiteSpace: 'pre-wrap', maxWidth: 'sm', ...textEllipsisCss(1) }}
            className="tiptap-content"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        )}
        <WithAvatar variant="small" {...data.owner} sx={{ mx: 'auto' }} />
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            position: 'sticky',
            top: (spacerRef?.clientHeight || 0) + 32,
            bgcolor: 'background.paper',
            zIndex: 5,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {totalStats}
          <Box sx={{ flexGrow: 1 }} />

          {data.enrolled && (
            <>
              <IconButton color="primary" onClick={() => setShowAll(!showAll)}>
                {showAll ? <ArrowDropDown /> : <ArrowDropUp />}
              </IconButton>
              <IconButton color="primary" onClick={refresh}>
                <Refresh />
              </IconButton>
              <ActionMenu data={data} />
            </>
          )}
        </Box>

        {/* lessons */}
        {data.enrolled ? (
          <Box sx={{ position: 'relative', mt: 3 }}>
            {(isLoading || isValidating) && (
              <Box sx={{ position: 'absolute', width: '100%', textAlign: 'center', top: '2em' }}>
                <GradientCircularProgress />
              </Box>
            )}
            <Stepper nonLinear activeStep={activeStep} orientation="vertical" sx={{ flexGrow: 1 }}>
              {lessons?.[0].items.map((lesson, i) => (
                <LessonStep
                  lesson={lesson}
                  stepIndex={i}
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                  showAll={showAll}
                  key={i}
                />
              ))}
            </Stepper>
          </Box>
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
  const scrollTimeoutRef = useRef<number>();

  useEffect(() => {
    if (stepIndex != activeStep) setActive(showAll);
  }, [showAll, stepIndex, activeStep]);

  useEffect(() => {
    const newActive = stepIndex == activeStep;
    setActive(newActive);

    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    if (newActive && stepRef.current) {
      scrollTimeoutRef.current = window.setTimeout(() => {
        setTimeout(() => {
          const yOffset = 150;
          const element = stepRef.current;
          if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 20);
      }, 330);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
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
          minHeight: '3em',
          '& .MuiStepLabel-label': { display: 'flex', gap: 3, alignItems: 'center' },
        }}
      >
        <Typography variant="h6">{lesson.title}</Typography>
        {!!lesson.score && (
          <Typography variant="subtitle2" color={lesson.passed ? 'success' : 'error'}>
            {t('Score {{ value }}', { value: toFixedHuman(lesson.score, 1) })}
          </Typography>
        )}
        {!!lesson.progress && (
          <Typography variant="subtitle2" color={lesson.passed ? 'success' : 'error'}>
            {t('Progress {{ value }} %', { value: toFixedHuman(lesson.progress, 1) })}
          </Typography>
        )}
      </StepLabel>
      <StepContent TransitionProps={{ unmountOnExit: false }}>
        <LessonCard data={lesson} embeded hideAvatar />
      </StepContent>
    </Step>
  );
};
