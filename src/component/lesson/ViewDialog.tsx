import { Card } from './Card';

import { LessonGetDisplayData, LessonGetDisplayResponse, lessonGetDisplay } from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const { data } = useServiceImmutable<LessonGetDisplayData, LessonGetDisplayResponse>(lessonGetDisplay, {
    id: open ? id : '',
  });

  if (!open || !data) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="lg"
      title={data.title}
      renderContent={() => <Card data={data} borderBox={false} />}
    />
  );
};
