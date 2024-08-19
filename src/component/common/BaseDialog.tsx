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
  useTheme,
} from '@mui/material';
import { useRef, useState } from 'react';

interface Props extends Omit<DialogProps, 'title'> {
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  headerButtons?: React.ReactNode;
  renderContent: (ref: React.RefObject<HTMLDivElement>) => React.ReactNode;
  actions?: React.ReactNode;
  minHeight?: string | number;
  props?: DialogProps;
}

const BaseDialog = ({
  open,
  fullWidth,
  setOpen,
  title,
  headerButtons,
  renderContent,
  actions,
  maxWidth = 'sm',
  minHeight,
  ...props
}: Props) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [forceFullWidth, setForceFullWidth] = useState(false);

  return (
    <Dialog
      ref={ref}
      fullWidth={fullWidth}
      maxWidth={forceFullWidth ? false : maxWidth}
      onClose={() => setOpen(false)}
      PaperProps={{ sx: { pb: 1, borderRadius: theme.shape.borderRadius } }}
      scroll="paper"
      onClick={(e) => e.stopPropagation()}
      {...props}
      open={open}
    >
      {title && (
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {headerButtons}
          {maxWidth != false && maxWidth != ('sm' as DialogProps['maxWidth']) && (
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

export default BaseDialog;
