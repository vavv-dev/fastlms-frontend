import { View } from './View';

import {
  SurveyAttemptResponse as AttemptResponse,
  SurveyGetAttemptData as GetAttemptData,
  surveyGetAttempt as getAttempt,
} from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
}

export const ViewDialog = ({ open, setOpen, id }: Props) => {
  const { isLoading, isValidating } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });

  if (!open) return null;

  return (
    <BaseDialog
      isReady={!isLoading && !isValidating}
      fullWidth
      maxWidth="smm"
      open={open}
      setOpen={setOpen}
      renderContent={() => <View id={id} />}
      sx={{ '& .MuiDialogContent-root': { padding: 0 } }}
    />
  );
};
