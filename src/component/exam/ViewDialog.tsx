import { Close, LiveHelpOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { View } from './View';

import { ExamAssessResponse as AssessResponse, ExamGetAssessData as GetAssessData, examGetAssess as getAssess } from '@/api';
import { chatDrawerState } from '@/component/chat';
import { BaseDialog, useServiceImmutable } from '@/component/common';
import { GlobalAlert } from '@/component/layout';
import { userState } from '@/store';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  onClose?: () => void;
}

const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED == 'true';

export const ViewDialog = ({ open, setOpen, id, onClose }: Props) => {
  const { t } = useTranslation('exam');
  const user = useAtomValue(userState);
  const setChatDrawerOpen = useSetAtom(chatDrawerState);
  const { data } = useServiceImmutable<GetAssessData, AssessResponse>(getAssess, { id });

  if (!open || !data) return null;

  return (
    <BaseDialog
      onClose={() => {
        setOpen(false);
        if (onClose) onClose();
      }}
      fullScreen={data.status === 'in_progress'}
      open={open}
      fullWidth
      setOpen={setOpen}
      maxWidth={'mdl'}
      renderContent={() => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            '& .MuiPaper-root': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ position: 'absolute', top: '0.5em', right: '0.5em', zIndex: 2, display: 'flex', gap: 1 }}>
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
          <GlobalAlert />
          <View id={data.id} />
        </Box>
      )}
      sx={{ '& .MuiDialogContent-root': { padding: 0, position: 'relative' } }}
    />
  );
};
