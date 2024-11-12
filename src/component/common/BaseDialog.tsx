import { Close, FullscreenExitOutlined, FullscreenOutlined } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';

import { chatDrawerState } from '@/component/chat';
import { textEllipsisCss } from '@/helper/util';

interface Props extends Omit<DialogProps, 'title'> {
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  headerButtons?: React.ReactNode;
  renderContent: (ref: React.RefObject<HTMLDivElement>) => React.ReactNode;
  actions?: React.ReactNode;
  minHeight?: string | number;
  props?: DialogProps;
}

export const BaseDialog = ({
  open,
  fullWidth,
  setOpen,
  title,
  headerButtons,
  renderContent,
  actions,
  maxWidth = 'sm',
  minHeight,
  sx,
  ...props
}: Props) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const chatDrawerOpen = useAtomValue(chatDrawerState);
  const [forceFullWidth, setForceFullWidth] = useState(false);
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      disableEnforceFocus={chatDrawerOpen}
      ref={ref}
      fullWidth={fullWidth}
      maxWidth={smDown ? undefined : forceFullWidth ? false : maxWidth}
      onClose={() => setOpen(false)}
      // fix. scroll paper empty space
      PaperProps={{ sx: { overflow: 'unset', borderRadius: theme.shape.borderRadius } }}
      scroll="paper"
      onClick={(e) => e.stopPropagation()}
      {...props}
      sx={{ ...(smDown && { '& .MuiDialog-paper': { margin: '8px', width: 'calc(100% - 16px)' } }), ...sx }}
      open={open}
    >
      {title && (
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" variant="subtitle2" sx={{ color: 'text.secondary', ...textEllipsisCss(1) }}>
            {title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {headerButtons}
          {!smDown && maxWidth != false && maxWidth != ('sm' as DialogProps['maxWidth']) && (
            <IconButton onClick={() => setForceFullWidth(!forceFullWidth)}>
              {!forceFullWidth ? <FullscreenOutlined fontSize="small" /> : <FullscreenExitOutlined fontSize="small" />}
            </IconButton>
          )}
          <IconButton onClick={() => setOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ minHeight: minHeight }}>{renderContent(ref)}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};
