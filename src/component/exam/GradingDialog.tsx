import { BaseDialog, useServiceImmutable } from '@/component/common';
import { useTranslation } from 'react-i18next';
import ExamGradingForm from './ExamGradingForm';
import { ExamAssessResponse, ExamGetGradingData, examGetGrading } from '@/api';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  examId: string;
  userId: number;
}

const GradingDialog = ({ open, setOpen, examId, userId }: Props) => {
  const { t } = useTranslation('exam');
  const { data: exam } = useServiceImmutable<ExamGetGradingData, ExamAssessResponse>(examGetGrading, { id: examId, userId });

  if (!open || !exam?.status) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={`${t(exam.status)} / ${t('{{ num }} points', { num: exam.score })} - ${exam?.title}`}
      maxWidth="md"
      renderContent={() => <ExamGradingForm examId={examId} userId={userId} />}
    />
  );
};

export default GradingDialog;
