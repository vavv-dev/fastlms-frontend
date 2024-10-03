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
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Box, IconButton, Step, StepContent, StepLabel, Stepper, Theme, Typography, useMediaQuery } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { spacerRefState } from '../layout';
import { LessonCard } from '../lesson';

const activeStepFamily = atomFamily(() => atom<number>(0));

export const View = () => {
  const location = useLocation();
  const { id } = useParams();
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id || '' });
  const { data: lessons } = useInfinitePagination<LessonGetDisplaysData, LessonGetDisplaysResponse>({
    apiOptions: { course: id, size: data?.lesson_count },
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

  if (!id || !data) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ m: 'auto', maxWidth: 'lg', display: 'flex', flexDirection: 'column', gap: '1em', position: 'relative' }}>
        <Box
          sx={{
            position: 'sticky',
            top: spacerRef?.clientHeight,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'center',
            zIndex: 4,
          }}
        >
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
            {data.title}
            {!data.description && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-wrap', mt: 1, maxWidth: 'md', mx: 'auto' }}
              >
                {data.description}
              </Typography>
            )}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, position: 'sticky', top: spacerRef?.clientHeight, zIndex: 4 }}>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="primary" onClick={() => setShowAll(!showAll)}>
            {showAll ? <ArrowDropDown /> : <ArrowDropUp />}
          </IconButton>
        </Box>

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
  setActiveStep: (value: number) => void;
  collapse?: boolean;
}

const LessonStep = ({ lesson, stepIndex, activeStep, setActiveStep, collapse, ...props }: LessonStepProps) => {
  const [hover, setHover] = useState(false);

  void hover;

  return (
    <Step
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setActiveStep(stepIndex)}
      active={!collapse || activeStep == stepIndex}
      completed={false}
      sx={{ '& .Mui-completed .MuiSvgIcon-root': { color: 'success.main' } }}
      key={stepIndex}
      {...props}
    >
      <StepLabel
        optional={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}></Box>}
        sx={{ gap: 2, cursor: 'pointer', minHeight: '3em' }}
      >
        <Typography variant="h6" sx={{ position: 'relative' }}>
          {lesson.title}
        </Typography>
      </StepLabel>
      <StepContent>
        <LessonCard data={lesson} embeded />
      </StepContent>
    </Step>
  );
};
