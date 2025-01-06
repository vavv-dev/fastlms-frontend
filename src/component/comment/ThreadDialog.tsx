import { ThreadProps } from '.';

import { Thread } from '@/component/comment';
import { BaseDialog } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  threadProps: ThreadProps;
}

export const ThreadDialog = ({ open, setOpen, threadProps }: Props) => {
  if (!open) return;

  return (
    <BaseDialog
      isReady
      fullWidth
      open={open}
      setOpen={setOpen}
      minHeight="400px"
      renderContent={() => <Thread {...threadProps} />}
      maxWidth={threadProps.editor ? 'md' : 'sm'}
      sx={{
        '& .MuiDialogContent-root': {
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      }}
    />
  );
};
