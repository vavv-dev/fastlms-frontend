import { Menu, MenuOpen } from '@mui/icons-material';
import { Button, Tooltip, Typography, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import { Theme } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { playerMessageState } from '..';
import { Drawer } from './Drawer';
import { Message } from './Message';
import { NextNotification } from './NextNotification';
import { useNavigation } from './useNavigation';

import {
  CourseGetViewData as GetViewData,
  CourseGetViewResponse as GetViewResponse,
  LessonDisplayResponse,
  LessonGetDisplaysData,
  LessonGetDisplaysResponse,
  ResourceLocation,
  VideoDisplayResponse,
  courseGetView as getView,
  lessonGetDisplays,
  courseUpdateLearning as updateLearning,
} from '@/api';
import { AssetView } from '@/component/asset';
import { ChatDrawer, chatDrawerState } from '@/component/chat';
import { GradientCircularProgress, useInfinitePagination, useServiceImmutable } from '@/component/common';
import { ExamView } from '@/component/exam';
import { GlobalAlert } from '@/component/layout';
import { QuizView } from '@/component/quiz';
import { SurveyView } from '@/component/survey';
import { VideoSimpleView } from '@/component/video';
import { textEllipsisCss } from '@/helper/util';

const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED == 'true';

export const Player = () => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();
  const [playerMessage, setPlayerMessage] = useAtom(playerMessageState);
  const location = useLocation();
  const [chatDrawerOpen, setChatDrawerOpen] = useAtom(chatDrawerState);
  const mdlUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('mdl'));
  const [open, setOpen] = useState(mdlUp);

  const { id } = useParams() as { id: string };
  const { data: course, mutate } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const {
    data: _lessons,
    isLoading,
    isValidating,
  } = useInfinitePagination<LessonGetDisplaysData, LessonGetDisplaysResponse>({
    apiService: lessonGetDisplays,
    apiOptions: course?.enrolled ? { course: id } : {},
  });

  const lessons = useMemo(() => _lessons?.[0]?.items || [], [_lessons]);
  const { resources, types, metas, indices } = useMemo(() => createResourceMaps(lessons), [lessons]);
  const resourceCount = Object.keys(resources).length;

  const startLocation = useMemo(() => {
    const stateLocation = location.state?.resourceLocation as ResourceLocation | undefined;
    return stateLocation || course?.resource_location || null;
  }, [course, location.state?.resourceLocation]);

  const { resourceLocation, setCurrentResource, handleForward, canGoForward } = useNavigation(
    indices,
    metas,
    resourceCount,
    startLocation,
    !!course?.sequential_learning,
  );

  useEffect(() => {
    if (!course) return;
    if (resourceLocation) return;
    if (course.resource_location) {
      setCurrentResource(course.resource_location);
      return;
    }
    const firstKey = Object.keys(indices).find((key) => indices[key] === 0);
    if (firstKey) {
      setCurrentResource(createResourceFromKey(firstKey));
    }
  }, [course, indices, resourceLocation, setCurrentResource]);

  useEffect(() => {
    return () => {
      if (!course?.id || !resourceLocation) return;
      const cr = course.resource_location;
      if (cr?.lesson_id === resourceLocation.lesson_id && cr?.resource_id === resourceLocation.resource_id) return;
      updateLearning({ id: course.id, requestBody: { resource_location: resourceLocation } })
        .then(() => mutate((prev) => prev && { ...prev, resource_location: resourceLocation }, { revalidate: false }))
        .catch(() => /* ignore */ null);
    };
  }, [course?.id, resourceLocation]); // eslint-disable-line

  useEffect(() => {
    if (playerMessage) {
      const timer = setTimeout(() => setPlayerMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [playerMessage, setPlayerMessage]);

  const handleDrawerClose = useCallback(() => {
    if (!mdlUp) setOpen(false);
  }, [mdlUp]);

  const currentKey = useMemo(() => createResourceKey(resourceLocation), [resourceLocation]);
  const currentType = currentKey ? types[currentKey] : null;

  const handleClose = () => {
    if (window.history.length <= 1) {
      navigate('/u');
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (location.state?.resourceLocation) {
      setCurrentResource(location.state.resourceLocation as ResourceLocation);
    }
  }, [location.state?.resourceLocation, setCurrentResource]);

  useEffect(() => {
    if (location.state?.resourceLocation) delete location.state.resourceLocation;
  }, [resourceLocation]); // eslint-disable-line

  if (!course) return null;

  return (
    <>
      <Box sx={{ display: 'flex', width: '100%', position: 'relative', height: '100vh' }}>
        <Drawer
          lessons={lessons}
          onResourceSelect={setCurrentResource}
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
            {AI_CHAT_ENABLED && (
              <Tooltip title={t('AI helper')}>
                <Button
                  onClick={() => setChatDrawerOpen(true)}
                  sx={{
                    width: 10,
                    minWidth: 10,
                    aspectRatio: 1,
                    borderRadius: '50%',
                    bgcolor: 'info.light',
                    '&:hover': { bgcolor: 'info.main' },
                    minHeight: 0,
                    color: (thmeme) => thmeme.palette.common.white,
                  }}
                >
                  A
                </Button>
              </Tooltip>
            )}
            <Tooltip title={t('Close')}>
              <Button
                onClick={handleClose}
                sx={{
                  width: 10,
                  minWidth: 10,
                  aspectRatio: 1,
                  borderRadius: '50%',
                  bgcolor: 'error.light',
                  '&:hover': { bgcolor: 'error.main' },
                }}
              />
            </Tooltip>
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
                }}
              >
                <Box sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <GlobalAlert />
                </Box>
                {resourceLocation && currentType && (
                  <>
                    {currentType.kind === 'video' && <VideoSimpleView id={resourceLocation.resource_id} />}
                    {currentType.kind === 'asset' && <AssetView id={resourceLocation.resource_id} />}
                    {currentType.kind === 'quiz' && <QuizView id={resourceLocation.resource_id} />}
                    {currentType.kind === 'survey' && <SurveyView id={resourceLocation.resource_id} />}
                    {currentType.kind === 'exam' && <ExamView id={resourceLocation.resource_id} />}
                  </>
                )}
              </Box>
              {canGoForward && currentKey && (
                <NextNotification
                  canGoForward={canGoForward}
                  onForward={handleForward}
                  nextMeta={getNextMeta(currentKey, indices, metas)}
                  nextProgress={`${indices[currentKey] + 2} / ${resourceCount}`}
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
}

const createResourceKey = (resource: ResourceLocation | null): string | null => {
  if (!resource) return null;
  return `${resource.lesson_id}::${resource.resource_id}`;
};

const createResourceFromKey = (key: string): ResourceLocation => {
  const [lessonId, resourceId] = key.split('::');
  return { lesson_id: lessonId, resource_id: resourceId };
};

const getNextMeta = (
  currentKey: string,
  indices: Record<string, number>,
  metas: Record<string, ResourceMeta>,
): ResourceMeta | null => {
  const currentIndex = indices[currentKey];
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
      };
      indices[key] = index++;
    });
  });

  return { resources, types, metas, indices };
};
