import { CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox, Lock, Menu, MenuOpen } from '@mui/icons-material';
import { Link, Tooltip, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { Theme, alpha, useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { ScoreDetail } from '../ScoreDetail';
import { checkResourceAccessible } from './util';

import { CourseDisplayResponse, LessonDisplayResponse, ResourceLocation } from '@/api';
import { TooltipIcon } from '@/component/share/TooltipIcon';
import { toFixedHuman } from '@/helper/util';

const drawerWidth = 300;

export interface DrawerProps {
  course: CourseDisplayResponse;
  lessons: LessonDisplayResponse[];
  onResourceSelect: (resource: ResourceLocation, showMessage?: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  types: Record<string, { kind: string; subKind?: string }>;
  metas: Record<string, { title: string; passed: boolean | null; status: string | null }>;
  currentKey: string | null;
  indices: Record<string, number>;
  sequentialLearning: boolean;
}

export const Drawer = ({
  course,
  lessons,
  onResourceSelect,
  open,
  setOpen,
  types,
  metas,
  currentKey,
  indices,
  sequentialLearning,
}: DrawerProps) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const mdlUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('mdl'));

  const handleDrawerClose = useCallback(() => {
    if (!mdlUp) setOpen(false);
  }, [mdlUp, setOpen]);

  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentKey]);

  const isResourceAccessible = useCallback(
    (key: string): boolean => {
      return checkResourceAccessible(key, indices, metas, sequentialLearning);
    },
    [indices, metas, sequentialLearning],
  );

  const renderResourceIcon = (key: string, meta: { passed: boolean | null; status: string | null }) => {
    if (meta.passed === true) {
      return <CheckBox fontSize="small" sx={{ color: 'success.main' }} />;
    }
    if (isResourceAccessible(key)) {
      if (meta.status === 'grading')
        return (
          <Tooltip title={t('Grading')}>
            <IndeterminateCheckBox fontSize="small" sx={{ color: 'warning.main' }} />
          </Tooltip>
        );
      return <CheckBoxOutlineBlank fontSize="small" sx={{ color: 'text.secondary' }} />;
    }
    return <Lock fontSize="small" sx={{ color: 'text.secondary' }} />;
  };

  return (
    <MuiDrawer
      variant={mdlUp ? 'permanent' : 'temporary'}
      open={open}
      sx={(theme) => ({ ...getDrawerStyle(theme, open), zIndex: theme.zIndex.modal + 1, height: '100vh' })}
      onClose={handleDrawerClose}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ display: 'flex', p: 1, pl: 1.5, gap: 1, alignItems: 'center' }}>
        <IconButton onClick={() => setOpen(!open)}>{!open ? <Menu /> : <MenuOpen />}</IconButton>
        {open && <Typography variant="h6">{t('Course resources')}</Typography>}
      </Box>
      <Divider />

      {open && (!!course.progress || !!course.score) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              mb: 0,
              p: 1,
              display: 'flex',
              gap: 1.5,
              justifyContent: 'center',
              alignItems: 'center',
              color: 'text.secondary',
              bgcolor: alpha(course.passed ? theme.palette.primary.main : theme.palette.warning.main, 0.1),
            }}
          >
            {!!course.progress && (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t('Progress {{ progress }} %', { progress: toFixedHuman(course.progress, 1) })}
              </Typography>
            )}
            {!!course.score && (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t('Score {{ score }} points', { score: toFixedHuman(course.score, 1) })}
              </Typography>
            )}

            <ScoreDetail
              course={course}
              lessons={lessons}
              sx={{ p: 0, color: 'text.secondary', '& .MuiSvgIcon-root': { fontSize: '1.2rem' } }}
            />
          </Box>

          {/* eligible */}
          {course.passed && course.certificate_templates.length > 0 && course.certificates.length === 0 && (
            <Link
              component={RouterLink}
              to={`/course/${course.id}`}
              underline="hover"
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              {t('You are eligible for a certificate.')}
            </Link>
          )}
        </Box>
      )}

      <List sx={{ overflow: 'auto' }}>
        {lessons.map((lesson, lessonIndex) => (
          <span key={lesson.id}>
            {open && lesson.resources.length > 0 && (
              <Typography
                component="div"
                variant="caption"
                sx={{ px: 2, pb: 0, mt: 2, textOverflow: 'ellipsis', overflow: 'hidden', color: 'text.secondary' }}
              >
                {`${lessonIndex + 1}. ${lesson.title}`}
              </Typography>
            )}
            {lesson.resource_displays.map((resource) => {
              const resourceObj = { lesson_id: lesson.id, resource_id: resource.id };
              const key = `${resourceObj.lesson_id}::${resourceObj.resource_id}`;
              const type = types[key];
              const meta = metas[key];
              const accessible = isResourceAccessible(key);

              return (
                <ListItem
                  key={key}
                  disablePadding
                  component="li"
                  sx={{ bgcolor: meta.passed ? 'action.selected' : 'transparent' }}
                  ref={currentKey === key ? activeItemRef : undefined}
                >
                  <ListItemButton
                    onClick={(e) => {
                      e.stopPropagation();
                      const newKey = `${resourceObj.lesson_id}::${resourceObj.resource_id}`;
                      if (newKey !== currentKey) {
                        onResourceSelect(resourceObj);
                      }
                      if (!mdlUp) setOpen(false);
                    }}
                    disabled={!accessible && sequentialLearning}
                    sx={{
                      minHeight: 48,
                      px: 2.5,
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'center',
                      ...(currentKey === key && {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        outline: `2px solid ${theme.palette.primary.main}`,
                      }),
                    }}
                  >
                    <TooltipIcon fontSize="small" kind={type.subKind || type.kind} t={t} />
                    <Typography
                      variant="body2"
                      sx={{
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        flexGrow: 1,
                      }}
                    >
                      {meta.title}
                    </Typography>
                    {renderResourceIcon(key, meta)}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </span>
        ))}
      </List>
    </MuiDrawer>
  );
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
      position: 'absolute',
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
      position: 'absolute',
    },
  }),
});
