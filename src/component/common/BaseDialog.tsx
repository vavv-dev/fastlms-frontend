import { Box, Button, Dialog, DialogActions, DialogContent, DialogProps, Tooltip, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GradientCircularProgress } from './GradientCircularProgress';

import { chatDrawerState } from '@/component/chat';

interface Props extends Omit<DialogProps, 'title'> {
  isReady: boolean;
  setOpen: (open: boolean) => void;
  headerButtons?: React.ReactNode;
  renderContent: (ref: React.RefObject<HTMLDivElement>) => React.ReactNode;
  actions?: React.ReactNode;
  minHeight?: string | number;
  props?: DialogProps;
}

export const BaseDialog = ({
  isReady,
  open,
  fullWidth,
  setOpen,
  headerButtons,
  renderContent,
  actions,
  maxWidth = 'sm',
  minHeight,
  fullScreen,
  sx,
  ...props
}: Props) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const chatDrawerOpen = useAtomValue(chatDrawerState);
  const [forceFullScreen, setForceFullScreen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  if (!isReady) {
    return (
      <Box
        sx={{ zIndex: theme.zIndex.modal + 1, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <GradientCircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Dialog
        fullScreen={forceFullScreen || fullScreen}
        disableEnforceFocus={chatDrawerOpen}
        ref={ref}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        onClose={handleClose}
        scroll="paper"
        onClick={(e) => e.stopPropagation()}
        {...props}
        sx={{
          '& > div > .MuiDialog-paper': {
            // mobile
            [theme.breakpoints.down('mobile')]:
              forceFullScreen || fullScreen
                ? { m: 0, width: '100vw', maxHeight: '100vh' }
                : { m: '8px', width: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)' },
            // mobile landscape
            [`${theme.breakpoints.down('md')} and (orientation: landscape)`]:
              forceFullScreen || fullScreen
                ? { m: 0, width: '100vw', maxHeight: '100vh' }
                : { m: '8px', width: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)' },
            borderRadius: forceFullScreen || fullScreen ? 0 : 3,
          },
          ...sx,
        }}
        open={open}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, px: 2, py: '6px' }}>
          {headerButtons}
          {fullWidth && !fullScreen && (
            <Tooltip title={forceFullScreen || fullScreen ? t('Exit full screen') : t('Full screen')}>
              <Button
                onClick={() => setForceFullScreen(!forceFullScreen)}
                sx={{
                  width: 10,
                  minWidth: 10,
                  aspectRatio: 1,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  '&:hover': { bgcolor: 'success.main' },
                }}
              />
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
        <DialogContent
          sx={{
            minHeight: minHeight,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            '& > div': { alignSelf: 'center', width: '100%', maxWidth: maxWidth || undefined },
          }}
        >
          {renderContent(ref)}
        </DialogContent>
        {actions && <DialogActions>{actions}</DialogActions>}
      </Dialog>
    </>
  );
};
