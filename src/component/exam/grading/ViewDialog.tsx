import { Form } from './Form';

import {
  ExamAttemptResponse as AttemptResponse,
  ExamGetGradingData as GetGradingData,
  examGetGrading as getGrading,
} from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  userId: string;
}

export const ViewDialog = ({ open, setOpen, id, userId }: Props) => {
  const { data, isLoading, isValidating } = useServiceImmutable<GetGradingData, AttemptResponse>(getGrading, { id, userId });

  if (!open || !data?.status) return null;

  return (
    <BaseDialog
      isReady={!isLoading && !isValidating}
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="md"
      renderContent={() => <Form id={id} userId={userId} />}
    />
  );
};
