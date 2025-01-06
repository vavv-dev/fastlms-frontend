import { Menu, MenuOpen, NavigateNext } from '@mui/icons-material';
import { Button, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { Theme } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useEmonCourseControl } from '../emon/useEmonCourseControl';
import { useCourseState } from '../useCourseState';
import { Drawer } from './Drawer';
import { Message } from './Message';
import { NextNotification } from './NextNotification';
import { useCourseLearningState } from './useCourseLearningState';
import { useNavigation } from './useNavigation';

import { LessonDisplayResponse, ResourceLocation, VideoDisplayResponse } from '@/api';
import { AssetView } from '@/component/asset';
import { ChatDrawer, chatDrawerState } from '@/component/chat';
import { GradientCircularProgress, WindowButton } from '@/component/common';
import { ExamView } from '@/component/exam';
import { GlobalAlert } from '@/component/layout';
import { QuizView } from '@/component/quiz';
import { SurveyView } from '@/component/survey';
import { VideoSimpleView } from '@/component/video';
import { textEllipsisCss } from '@/helper/util';
import { courseExamResetState } from '..';

const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED == 'true';

export const Player = () => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();
  const [playerMessage, setPlayerMessage] = useState<string | null>(null);
  const location = useLocation();
  const [chatDrawerOpen, setChatDrawerOpen] = useAtom(chatDrawerState);
  const mdlUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('mdl'));
  const [open, setOpen] = useState(mdlUp);

  const { id } = useParams() as { id: string };
  const { course, courseMutate, lessons, isLoading, isValidating } = useCourseState(id);
  const { resources, types, metas, indices } = useMemo(() => createResourceMaps(lessons), [lessons]);

  const resourceCount = Object.keys(resources).length;
  const startLocation = useMemo(() => {
    const stateLocation = location.state?.resourceLocation ? { ...location.state.resourceLocation } : null;
    delete location.state?.resourceLocation;
    return stateLocation || course?.resource_location || null;
  }, [course, location.state]);

  const { resourceLocation, setResourceLocation, handleForward, canForward, handleBackward, canBackward } = useNavigation(
    indices,
    metas,
    resourceCount,
    startLocation,
    !!course?.sequential_learning,
    setPlayerMessage,
    course?.id || null,
    course?.emon_managed_course,
  );

  // save learning state
  useCourseLearningState(course, courseMutate, lessons, resourceLocation);

  // emon course control
  const { showAuthBox, AuthBox, updateResourceLocation } = useEmonCourseControl(course?.id || null);
  const [examReset, setExamReset] = useAtom(courseExamResetState);

  useEffect(() => {
    if (!examReset || !resourceLocation || !course?.emon_managed_course) return;
    updateResourceLocation(resourceLocation, setResourceLocation);
    setExamReset(null);
    // do not add resourceLocation to the dependencies
  }, [examReset]); // eslint-disable-line

  const handleDrawerClose = useCallback(() => {
    if (!mdlUp) setOpen(false);
  }, [mdlUp]);

  const currentKey = useMemo(() => createResourceKey(resourceLocation), [resourceLocation]);
  const currentType = currentKey ? types[currentKey] : null;

  const handleClose = () => {
    if (window.history.length <= 1) navigate('/u');
    else navigate(-1);
  };

  if (!course) return null;

  return (
    <>
      <Box sx={{ display: 'flex', width: '100%', position: 'relative', height: '100vh' }}>
        <Drawer
          course={course}
          lessons={lessons}
          onResourceSelect={setResourceLocation}
          open={open}
          setOpen={setOpen}
          types={types}
          metas={metas}
          currentKey={currentKey}
          indices={indices}
          sequentialLearning={course.sequential_learning}
        />
        <Box
          component="main"
          sx={{
            maxWidth: '100%',
            display: 'flex',
            flexGrow: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
          onClick={handleDrawerClose}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: '6px' }}>
            {!mdlUp && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((prev) => !prev);
                }}
                sx={{ p: 0, minHeight: 0, minWidth: 0, my: '-1em' }}
              >
                {open ? <MenuOpen /> : <Menu />}
              </Button>
            )}
            <Typography variant="subtitle2" sx={{ lineHeight: 1, color: 'text.secondary', ...textEllipsisCss(1) }}>
              {course.title}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />

            <WindowButton
              disabled={!canBackward}
              title={t('Previous')}
              onClick={handleBackward}
              color={{ light: 'warning.light', main: 'warning.main' }}
            >
              <NavigateNext fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
            </WindowButton>
            <WindowButton
              disabled={!canForward}
              title={t('Next')}
              onClick={handleForward}
              color={{ light: 'warning.light', main: 'warning.main' }}
            >
              <NavigateNext fontSize="small" />
            </WindowButton>
            {AI_CHAT_ENABLED && (
              <WindowButton
                title={t('AI helper')}
                onClick={() => setChatDrawerOpen(true)}
                color={{ light: 'info.light', main: 'info.main' }}
              >
                <Typography variant="caption">A</Typography>{' '}
              </WindowButton>
            )}
            <WindowButton title={t('Close')} onClick={handleClose} color={{ light: 'error.light', main: 'error.main' }} />
          </Box>
          <Message message={playerMessage} onClose={() => setPlayerMessage(null)} />

          {isLoading || isValidating ? (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <GradientCircularProgress />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  flexGrow: 1,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  overflow: 'auto',
                  ...(currentType?.kind === 'video'
                    ? {
                        '& > div:last-child': { maxHeight: '-webkit-fill-available', flexWrap: 'nowrap', overflow: 'auto' },
                        '& .player-wrapper': { flexShrink: 0 },
                        '& .subtitlewrapper': {
                          overflow: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                          overflowY: 'auto',
                          minHeight: '350px',
                          maxHeight: 'unset',
                        },
                        '& .subtitlebox': { height: '100%', maxHeight: 'unset' },
                      }
                    : { '& > div:last-child': { my: 'auto' } }),
                }}
              >
                <Box sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <GlobalAlert />
                </Box>
                {showAuthBox ? (
                  <AuthBox sx={{ maxWidth: '400px', width: '100%' }} />
                ) : (
                  resourceLocation &&
                  currentType && (
                    <>
                      {currentType.kind === 'video' && <VideoSimpleView id={resourceLocation.resource_id} />}
                      {currentType.kind === 'asset' && <AssetView id={resourceLocation.resource_id} />}
                      {currentType.kind === 'quiz' && <QuizView id={resourceLocation.resource_id} />}
                      {currentType.kind === 'survey' && <SurveyView id={resourceLocation.resource_id} />}
                      {currentType.kind === 'exam' && <ExamView id={resourceLocation.resource_id} />}
                    </>
                  )
                )}
              </Box>
              {canForward && (
                <NextNotification
                  canForward={canForward}
                  onForward={handleForward}
                  nextMeta={getNextMeta(currentKey, indices, metas)}
                  nextProgress={`${(currentKey ? indices[currentKey] : -1) + 2} / ${resourceCount}`}
                />
              )}
            </>
          )}
        </Box>
      </Box>
      {chatDrawerOpen && <ChatDrawer open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} />}
    </>
  );
};

interface ResourceType {
  kind: string;
  subKind?: string;
}

interface ResourceMeta {
  title: string;
  thumbnail: string;
  passed: boolean | null;
  status: string | null;
}

const createResourceKey = (resource: ResourceLocation | null): string | null => {
  if (!resource) return null;
  return `${resource.lesson_id}::${resource.resource_id}`;
};

const getNextMeta = (
  currentKey: string | null,
  indices: Record<string, number>,
  metas: Record<string, ResourceMeta>,
): ResourceMeta | null => {
  const currentIndex = currentKey ? indices[currentKey] : -1;
  const nextKey = Object.keys(indices).find((key) => indices[key] === currentIndex + 1);
  return nextKey ? metas[nextKey] : null;
};

// Type guard
const hasSubKind = (resource: LessonDisplayResponse['resource_displays'][0]): resource is VideoDisplayResponse =>
  'sub_kind' in resource;

interface ResourceMaps {
  resources: Record<string, ResourceLocation>;
  types: Record<string, ResourceType>;
  metas: Record<string, ResourceMeta>;
  indices: Record<string, number>;
}

const createResourceMaps = (lessons: LessonDisplayResponse[]): ResourceMaps => {
  const resources: Record<string, ResourceLocation> = {};
  const types: Record<string, ResourceType> = {};
  const metas: Record<string, ResourceMeta> = {};
  const indices: Record<string, number> = {};
  let index = 0;

  lessons.forEach((lesson) => {
    lesson.resource_displays.forEach((resource) => {
      const resourceObj = { lesson_id: lesson.id, resource_id: resource.id };
      const key = createResourceKey(resourceObj);
      if (!key) return;

      resources[key] = resourceObj;
      types[key] = {
        kind: resource.kind,
        subKind: hasSubKind(resource) ? resource.sub_kind : undefined,
      };
      metas[key] = {
        title: resource.title,
        thumbnail: resource.thumbnail,
        passed: resource.passed,
        status: 'status' in resource ? resource.status : null,
      };

      indices[key] = index++;
    });
  });

  return { resources, types, metas, indices };
};
