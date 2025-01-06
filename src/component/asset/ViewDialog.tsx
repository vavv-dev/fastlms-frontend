import { useTheme } from '@mui/material';

import { View } from './View';

import {
  AssetDisplayResponse as DisplayResponse,
  AssetGetDisplayData as GetDisplayData,
  assetGetDisplay as getDisplay,
} from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const theme = useTheme();
  const { data, isLoading, isValidating } = useServiceImmutable<GetDisplayData, DisplayResponse>(getDisplay, { id });

  if (!open) return null;

  return (
    <BaseDialog
      isReady={!isLoading && !isValidating}
      fullWidth
      maxWidth="lg"
      open={open}
      setOpen={setOpen}
      onClick={(e) => e.stopPropagation()}
      renderContent={() => <View id={id} />}
      sx={{
        '& .MuiDialogContent-root': { padding: 0 },
        '& .MuiDialog-paper': {
          // mobile
          [theme.breakpoints.down('mobile')]: data?.sub_kind === 'html' && { height: '100%' },
          // mobile landscape
          [`${theme.breakpoints.down('md')} and (orientation: landscape)`]: data?.sub_kind === 'html' && { height: '100%' },
          ...(data?.sub_kind === 'pdf' && { height: '100%' }),
        },
      }}
    />
  );
};
