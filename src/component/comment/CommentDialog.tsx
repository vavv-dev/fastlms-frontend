import { CommentThread } from '@/component/comment';
import { BaseDialog } from '@/component/common';
import { ICommentThreadProps } from '.';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  commentThreadProps: ICommentThreadProps;
}

const CommentDialog = ({ open, setOpen, commentThreadProps }: Props) => {
  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={commentThreadProps.title}
      minHeight="400px"
      renderContent={() => <CommentThread {...commentThreadProps} />}
    />
  );
};

export default CommentDialog;
