import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';

import { View } from './View';

import { BaseDialog } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  if (!open) return null;

  return (
    <BaseDialog
      fullWidth
      maxWidth="smm"
      open={open}
      setOpen={setOpen}
      renderContent={() => (
        <>
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', top: '0.5em', right: '0.5em' }}>
            <Close />
          </IconButton>
          <View id={id} />
        </>
      )}
      sx={{
        '& .MuiDialog-paper': { bgcolor: 'transparent' },
        '& .MuiDialogContent-root': { padding: 0 },
      }}
    />
  );
};
