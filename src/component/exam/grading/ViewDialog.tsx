import { ExamAssessResponse as AssessResponse, ExamGetGradingData as GetGradingData, examGetGrading as getGrading } from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';
import { useTranslation } from 'react-i18next';
import { Form } from './Form';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string;
  userId: number;
}

export const ViewDialog = ({ open, setOpen, id, userId }: Props) => {
  const { t } = useTranslation('exam');
  const { data } = useServiceImmutable<GetGradingData, AssessResponse>(getGrading, { id, userId });

  if (!open || !data?.status) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={`${t(data.status)} / ${t('{{ num }} points', { num: data.score })} - ${data?.title}`}
      maxWidth="md"
      renderContent={() => <Form id={id} userId={userId} />}
    />
  );
};
