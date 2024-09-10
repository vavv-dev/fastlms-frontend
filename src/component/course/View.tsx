import {
  CourseViewLesson,
  CourseViewLessonEmbedResource as EmbedResource,
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  courseGetView as getView,
} from '@/api';

import { useServiceImmutable } from '@/component/common';
import { ResourceViewer } from '@/component/lesson';
import { decodeURLText } from '@/helper/util';
import { userState } from '@/store';
import { ArrowDropDown, ArrowDropUp, CheckOutlined } from '@mui/icons-material';
import { Box, Button, Chip, IconButton, Paper, Step, StepContent, StepLabel, Stepper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollRestoration, useParams } from 'react-router-dom';

const activeStepFamily = atomFamily(() => atom<number>(0));

export const View = () => {
  const { id } = useParams();
  const user = useAtomValue(userState);
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id || '' });
  const [showAll, setShowAll] = useState(false);
  const [activeStep, setActiveStep] = useAtom(activeStepFamily(id));

  void user;

  if (!id || !data) return null;

  return (
    <Box sx={{ display: 'block', width: '100%', p: 3 }}>
      <Box sx={{ m: 'auto', maxWidth: 'md', display: 'flex', flexDirection: 'column', gap: '1em', position: 'relative' }}>
        {/* course title */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          <Typography variant="h4" sx={{ flexGrow: 1, textAlign: 'center' }}>
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

        {/* controler */}
        <Box sx={{ display: 'flex', gap: 1, position: 'sticky', top: '70px', zIndex: 1 }}>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="primary" onClick={() => setShowAll(!showAll)}>
            {showAll ? <ArrowDropUp /> : <ArrowDropDown />}
          </IconButton>
        </Box>

        {/* lessons */}
        <Stepper nonLinear activeStep={activeStep} orientation="vertical" sx={{ flexGrow: 1 }}>
          {data.lessons.map((lesson, i) => (
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
        <ScrollRestoration />
      </Box>
    </Box>
  );
};

interface LessonStepProps {
  lesson: CourseViewLesson;
  stepIndex: number;
  activeStep: number;
  setActiveStep: (value: number) => void;
  collapse?: boolean;
}

const LessonStep = ({ lesson, stepIndex, activeStep, setActiveStep, collapse, ...props }: LessonStepProps) => {
  const { t } = useTranslation('course');
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
      <StepContent sx={{ pl: 4.5 }}>
        <Box
          dangerouslySetInnerHTML={{ __html: decodeURLText(lesson.description) }}
          sx={{ whiteSpace: 'pre-wrap', '& p': { my: 0 }, fontSize: '0.9rem' }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('Lesson Resources')}
          </Typography>
          <ResourceStepper resources={lesson.resources} />
        </Box>
      </StepContent>
    </Step>
  );
};

const ResourceStepper = ({ resources }: { resources: EmbedResource[] }) => {
  const { t } = useTranslation('course');
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation="vertical" connector={null}>
        {resources.map((resource) => (
          <Step key={resource.id}>
            <StepLabel>
              <Grid container spacing={2} sx={{ alignItems: 'center', pl: 1 }}>
                <Grid size={{ xs: 1 }}>
                  <Typography variant="body2">{t(resource.kind)}</Typography>
                </Grid>
                <Grid size={{ xs: 9 }}>
                  <ResourceViewer resource={resource} />
                </Grid>
                <Grid size={{ xs: 2 }}>
                  <Chip icon={<CheckOutlined />} size="small" onClick={handleNext} label={t('Completed')} />
                </Grid>
              </Grid>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === resources.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  );
};
