import { ArrowLeft, ArrowRight, CheckBox, CheckBoxOutlineBlank, Menu, MenuOpen } from '@mui/icons-material';
import { Button, Tooltip, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { Theme, alpha, useTheme } from '@mui/material/styles';
import { atom, useAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseGetViewResponse, LessonDisplayResponse, VideoDisplayResponse } from '@/api';
import { AssetView } from '@/component/asset';
import { ExamView } from '@/component/exam';
import { GlobalAlert } from '@/component/layout';
import { QuizView } from '@/component/quiz';
import { TooltipIcon } from '@/component/share';
import { SurveyView } from '@/component/survey';
import { VideoSimpleView } from '@/component/video';

const drawerWidth = 300;

interface CurrentResource {
  kind: string;
  subKind?: string;
  id: string;
  key: string;
  index: number;
}

const currentResourceFamily = atomFamily(() => atom<CurrentResource | null>(null));

const hasSubKind = (resource: LessonDisplayResponse['resource_displays'][0]): resource is VideoDisplayResponse =>
  'sub_kind' in resource;

const createResourceMap = (lessons: LessonDisplayResponse[]) => {
  const resourceList = lessons.flatMap((lesson, lessonIndex) =>
    lesson.resource_displays.map((resource, resourceIndex) => ({
      kind: resource.kind,
      subKind: hasSubKind(resource) ? resource.sub_kind : undefined,
      id: resource.id,
      key: `${lessonIndex}-${resourceIndex}`,
      index: 0,
    })),
  );

  return resourceList.reduce(
    (acc, resource, index) => {
      acc[resource.key] = {
        ...resource,
        index,
      };
      return acc;
    },
    {} as Record<string, CurrentResource>,
  );
};

const useResourceNavigation = (courseId: string, resources: Record<string, CurrentResource>, resourceCount: number) => {
  const [currentResource, setCurrentResource] = useAtom(currentResourceFamily(courseId));

  const handleForward = useCallback(() => {
    if (!currentResource) return;
    const nextResource = Object.values(resources).find((r) => r.index === currentResource.index + 1);
    if (nextResource) setCurrentResource(nextResource);
  }, [currentResource?.index, resources, setCurrentResource]); // eslint-disable-line

  const handleBackward = useCallback(() => {
    if (!currentResource) return;
    const prevResource = Object.values(resources).find((r) => r.index === currentResource.index - 1);
    if (prevResource) setCurrentResource(prevResource);
  }, [currentResource?.index, resources, setCurrentResource]); // eslint-disable-line

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!currentResource) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          handleForward();
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          handleBackward();
          break;
      }
    },
    [currentResource?.index, handleForward, handleBackward], // eslint-disable-line
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    currentResource,
    setCurrentResource,
    handleForward,
    handleBackward,
    canGoForward: currentResource && currentResource.index < resourceCount - 1,
    canGoBackward: currentResource && currentResource.index > 0,
  };
};

const getDrawerStyle = (theme: Theme, isOpen: boolean) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(isOpen && {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
    },
  }),
  ...(!isOpen && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
      width: `calc(${theme.spacing(8)} + 1px)`,
    },
    '& .MuiDrawer-paper': {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      width: `calc(${theme.spacing(7)} + 1px)`,
      [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
      },
    },
  }),
});

interface Props {
  course: CourseGetViewResponse;
  lessons: LessonDisplayResponse[];
}

export const Player = ({ course, lessons }: Props) => {
  const { t } = useTranslation('course');
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const [open, setOpen] = useState(lgUp);

  const resources = useMemo(() => createResourceMap(lessons), [lessons]);
  const resourceCount = Object.keys(resources).length;

  const { currentResource, setCurrentResource, handleForward, handleBackward, canGoForward, canGoBackward } =
    useResourceNavigation(course.id, resources, resourceCount);

  useEffect(() => {
    if (currentResource) return;
    const firstResource = Object.values(resources).find((r) => r.index === 0);
    if (firstResource) setCurrentResource(firstResource);
  }, [lessons, resources, currentResource, setCurrentResource]);

  const handleDrawerClose = useCallback(() => {
    if (!lgUp) setOpen(false);
  }, [lgUp]);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Drawer
        variant={lgUp ? 'permanent' : 'temporary'}
        open={open}
        sx={(theme) => ({
          ...getDrawerStyle(theme, open),
          zIndex: theme.zIndex.modal + 1,
        })}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ display: 'flex', p: 1, pl: 1.5, gap: 1, alignItems: 'center' }}>
          <IconButton onClick={() => setOpen((prev) => !prev)}>{!open ? <Menu /> : <MenuOpen />}</IconButton>
          {open && <Typography variant="h6">{t('Course resources')}</Typography>}
        </Box>
        <Divider />
        <Sidebar
          course={course}
          lessons={lessons}
          currentResource={currentResource}
          onResourceSelect={setCurrentResource}
          open={open}
          resources={resources}
        />
      </Drawer>

      {!lgUp && !open && (
        <IconButton
          onClick={() => setOpen((prev) => !prev)}
          sx={(theme) => ({
            position: 'fixed',
            left: '8px',
            top: '8px',
            zIndex: theme.zIndex.modal + 1,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Menu />
        </IconButton>
      )}

      <Box
        component="main"
        sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', position: 'relative' }}
        onClick={handleDrawerClose}
      >
        <Box sx={{ position: 'relative', mx: 'auto' }}>
          <GlobalAlert />
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            maxHeight: 'calc(100vh - 64px)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
            pb: 1,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {currentResource && (
            <>
              {currentResource.kind === 'video' && <VideoSimpleView id={currentResource.id} />}
              {currentResource.kind === 'asset' && <AssetView id={currentResource.id} />}
              {currentResource.kind === 'quiz' && <QuizView id={currentResource.id} />}
              {currentResource.kind === 'survey' && <SurveyView id={currentResource.id} />}
              {currentResource.kind === 'exam' && <ExamView id={currentResource.id} />}
            </>
          )}
        </Box>

        <Box
          sx={{
            left: 0,
            bottom: 0,
            width: '100%',
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 64,
            p: 1,
          }}
        >
          <Tooltip title={t('Previous resource')}>
            <span>
              <Button
                variant="contained"
                onClick={handleBackward}
                disabled={!canGoBackward}
                sx={{ width: 48, height: 48, borderRadius: '50%', minWidth: 'unset' }}
              >
                <ArrowLeft />
              </Button>
            </span>
          </Tooltip>

          {currentResource && (
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              {`${currentResource.index + 1} / ${resourceCount}`}
            </Typography>
          )}

          <Tooltip title={t('Next resource')}>
            <span>
              <Button
                variant="contained"
                onClick={handleForward}
                disabled={!canGoForward}
                sx={{ width: 48, height: 48, borderRadius: '50%', minWidth: 'unset' }}
              >
                <ArrowRight />
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

const Sidebar = ({
  lessons,
  currentResource,
  onResourceSelect,
  open,
  resources,
}: Props & {
  currentResource: CurrentResource | null;
  onResourceSelect: (resource: CurrentResource) => void;
  open: boolean;
  resources: Record<string, CurrentResource>;
}) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentResource?.id]);

  return (
    <List sx={{ overflow: 'auto' }}>
      {lessons.map((lesson, lessonIndex) => (
        <span key={lesson.id}>
          {open && lesson.resources.length > 0 && (
            <Typography
              component="div"
              variant="caption"
              sx={{ px: 2, pb: 0, mt: 2, textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {`${lessonIndex + 1}. ${lesson.title}`}
            </Typography>
          )}
          {lesson.resource_displays.map((resource, resourceIndex) => {
            const key = `${lessonIndex}-${resourceIndex}`;

            return (
              <ListItem
                key={key}
                disablePadding
                component="li"
                sx={{ bgcolor: resource.passed ? 'action.selected' : 'transparent' }}
                ref={currentResource?.id === resource.id && currentResource?.key === key ? activeItemRef : undefined}
              >
                <ListItemButton
                  onClick={() => onResourceSelect(resources[key])}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    ...(currentResource?.id === resource.id &&
                      currentResource?.key === key && {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        outline: `2px solid ${theme.palette.primary.main}`,
                      }),
                  }}
                >
                  <TooltipIcon fontSize="small" kind={hasSubKind(resource) ? resource.sub_kind : resource.kind} t={t} />
                  <Typography variant="body2" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', flexGrow: 1 }}>
                    {resource.title}
                  </Typography>
                  {resource.passed ? (
                    <CheckBox fontSize="small" sx={{ color: 'success.main' }} />
                  ) : (
                    <CheckBoxOutlineBlank fontSize="small" sx={{ color: 'text.secondary' }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </span>
      ))}
    </List>
  );
};
