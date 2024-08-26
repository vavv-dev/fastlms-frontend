import { Thread } from '@/component/comment';
import { BaseDialog } from '@/component/common';
import { ThreadProps } from '.';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  threadProps: ThreadProps;
}

export const ThreadDialog = ({ open, setOpen, threadProps }: Props) => {
  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={threadProps.title}
      minHeight="400px"
      renderContent={() => <Thread {...threadProps} />}
    />
  );
};
