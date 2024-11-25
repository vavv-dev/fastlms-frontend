import { Close, LiveHelpOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Player } from './Player';

import { CourseGetViewResponse as GetViewResponse, LessonDisplayResponse } from '@/api';
import { chatDrawerState } from '@/component/chat';
import { BaseDialog } from '@/component/common';
import { userState } from '@/store';

const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED == 'true';

interface Props {
  course: GetViewResponse;
  lessons: LessonDisplayResponse[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const PlayerDialog = ({ course, lessons, open, setOpen }: Props) => {
  const { t } = useTranslation('course');
  const user = useAtomValue(userState);
  const setChatDrawerOpen = useSetAtom(chatDrawerState);

  if (!open || !user) return null;

  return (
    <BaseDialog
      fullWidth
      fullScreen
      open={open}
      setOpen={setOpen}
      // title={course.title}
      renderContent={() => (
        <>
          <Box sx={{ position: 'absolute', top: '0.5em', right: '0.5em', zIndex:2, display: 'flex', gap: 1 }}>
            {AI_CHAT_ENABLED && user && (
              <Tooltip title={t('AI help')}>
                <IconButton onClick={() => setChatDrawerOpen(true)}>
                  <LiveHelpOutlined />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Player course={course} lessons={lessons} />
        </>
      )}
      sx={{
        '& .MuiDialogContent-root': { bgcolor: 'divider', p: 0 },
        '& .MuiDialogPaper-root': { minHeight: '100vh' },
      }}
    />
  );
};
