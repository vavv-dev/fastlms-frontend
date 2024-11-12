import { Form } from './Form';

import { ExamAssessResponse as AssessResponse, ExamGetGradingData as GetGradingData, examGetGrading as getGrading } from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  userId: string;
}

export const ViewDialog = ({ open, setOpen, id, userId }: Props) => {
  const { data } = useServiceImmutable<GetGradingData, AssessResponse>(getGrading, { id, userId });

  if (!open || !data?.status) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={data?.title}
      maxWidth="md"
      renderContent={() => <Form id={id} userId={userId} />}
    />
  );
};
