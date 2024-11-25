import { useMediaQuery } from '@mui/material';
import { useAtomValue } from 'jotai';

import { View } from './View';

import { AssetDisplayResponse, AssetGetDisplayData, assetGetDisplay } from '@/api';
import { chatDrawerState } from '@/component/chat';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const { data } = useServiceImmutable<AssetGetDisplayData, AssetDisplayResponse>(assetGetDisplay, { id });
  const chatDrawerOpen = useAtomValue(chatDrawerState);
  const smDown = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  if (!open || !data) return null;

  return (
    <BaseDialog
      fullWidth
      maxWidth="lg"
      open={open}
      setOpen={setOpen}
      onClick={(e) => e.stopPropagation()}
      renderContent={() => <View id={id} />}
      sx={{
        '& .MuiDialogContent-root': { padding: 0 },
        '& .MuiDialog-paper': {
          borderRadius: 3,
          overflow: 'hidden',
          ...(smDown && {
            margin: '8px',
            width: 'calc(100% - 16px)',
            height: data.sub_kind === 'html' ? 'calc(100% - 16px)' : 'auto',
          }),
        },
      }}
      disableEnforceFocus={chatDrawerOpen}
    />
  );
};
