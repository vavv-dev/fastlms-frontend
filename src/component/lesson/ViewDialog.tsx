import { Card } from './Card';

import { LessonGetDisplayData, LessonGetDisplayResponse, lessonGetDisplay } from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const { data, isLoading, isValidating } = useServiceImmutable<LessonGetDisplayData, LessonGetDisplayResponse>(
    lessonGetDisplay,
    { id },
  );

  if (!open) return null;

  return (
    <BaseDialog
      isReady={!isLoading && !isValidating}
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="lg"
      renderContent={() => data && <Card data={data} borderBox={false} />}
      sx={{ '& .MuiDialogContent-root > div': { width: '100%' } }}
    />
  );
};
