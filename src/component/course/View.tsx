import {
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  LessonDisplayResponse,
  LessonGetDisplaysData,
  LessonGetDisplaysResponse,
  courseGetView as getView,
  lessonGetDisplays,
} from '@/api';
import { useInfinitePagination, useServiceImmutable } from '@/component/common';
import { spacerRefState } from '@/component/layout';
import { LessonCard } from '@/component/lesson';
import { parseLocalStorage, textEllipsisCss, toFixedHuman } from '@/helper/util';
import { ArrowDropDown, ArrowDropUp, Refresh } from '@mui/icons-material';
import { Box, Button, IconButton, Step, StepContent, StepLabel, Stepper, Theme, Typography, useMediaQuery } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';

const activeStepKey = parseLocalStorage('activeStep', 0);
const activeStepFamily = atomFamily(() => atomWithStorage<number>(activeStepKey, 0));

export const View = () => {
  const { t } = useTranslation('course');
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, mutate } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id || '' });
  const { data: lessons, mutate: lessonMutate } = useInfinitePagination<LessonGetDisplaysData, LessonGetDisplaysResponse>({
    apiOptions: data?.enrolled ? { course: id, size: 100 } : {},
    apiService: lessonGetDisplays,
  });
  const [showAll, setShowAll] = useState(false);
  const [activeStep, setActiveStep] = useAtom(activeStepFamily(id));
  const spacerRef = useAtomValue(spacerRefState);

  // update spacerRef height
  useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    if (location.state?.activeStep != undefined) {
      setActiveStep(location.state.activeStep);
      delete location.state.activeStep;
    }
  }, [location.state?.activeStep, setActiveStep]);

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
    return (
      <Typography
        variant="subtitle1"
        sx={{ mb: 2, color: data?.passed ? 'success.main' : 'warning.main', display: 'flex', gap: 2 }}
      >
        <span>{t('Total progress')}:</span> {`${toFixedHuman((passed / total) * 100, 1)} % (${passed} / ${total})`}
      </Typography>
    );
  }, [lessons, data, t]);

  if (!id || !data || !data.enrolled) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ m: 'auto', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: 1, position: 'relative' }}>
        <Typography
          variant="h5"
          sx={{
            position: 'sticky',
            top: spacerRef?.clientHeight,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'center',
            zIndex: 4,
            flexGrow: 1,
            textAlign: 'center',
          }}
        >
          {data.title}
          {!data.description && (
            <Typography
              variant="caption"
              sx={{
                lineHeight: 1.5,
                color: 'text.secondary',
                whiteSpace: 'pre-wrap',
                maxWidth: 'sm',
                ...textEllipsisCss(1),
              }}
              className="tiptap-content"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          )}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            position: 'sticky',
            top: (spacerRef?.clientHeight || 0) + 32,
            bgcolor: 'background.paper',
            zIndex: 4,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate('.', { state: { dialog: { question: true, ...data } } });
            }}
          >
            {t('Q&A')}
          </Button>
          <IconButton color="primary" onClick={() => setShowAll(!showAll)}>
            {showAll ? <ArrowDropDown /> : <ArrowDropUp />}
          </IconButton>
          <IconButton color="primary" onClick={refresh}>
            <Refresh />
          </IconButton>
          <ActionMenu data={data} />
        </Box>

        {totalStats}

        {/* lessons */}
        <Stepper nonLinear activeStep={activeStep} orientation="vertical" sx={{ flexGrow: 1 }}>
          {lessons?.[0].items.map((lesson, i) => (
            <LessonStep
              lesson={lesson}
              stepIndex={i}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              collapse={!showAll}
              key={i}
            />
          ))}
        </Stepper>
      </Box>
    </Box>
  );
};

interface LessonStepProps {
  lesson: LessonDisplayResponse;
  stepIndex: number;
  activeStep: number;
  setActiveStep: (value: number | ((prev: number) => number)) => void;
  collapse?: boolean;
}

const LessonStep = ({ lesson, stepIndex, activeStep, setActiveStep, collapse, ...props }: LessonStepProps) => {
  const { t } = useTranslation('course');
  const [, setHover] = useState(false);

  return (
    <Step
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setActiveStep((prev) => (prev == stepIndex ? -1 : stepIndex))}
      active={!collapse || activeStep == stepIndex}
      completed={!!lesson.passed}
      sx={{ '& .Mui-completed .MuiSvgIcon-root': { color: 'success.main' } }}
      key={stepIndex}
      {...props}
    >
      <StepLabel
        sx={{
          gap: 2,
          cursor: 'pointer',
          minHeight: '3em',
          '& .MuiStepLabel-label': { display: 'flex', gap: 3, alignItems: 'center' },
        }}
      >
        <Typography variant="h6">{lesson.title}</Typography>
        {activeStep != stepIndex && (
          <>
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
          </>
        )}
      </StepLabel>
      <StepContent TransitionProps={{ unmountOnExit: false }}>
        <LessonCard data={lesson} embeded />
      </StepContent>
    </Step>
  );
};
