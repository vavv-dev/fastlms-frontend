import { ExamDisplayResponse } from '@/api';
import { BaseDialog } from '@/component/common';
import { formatYYYMMDD } from '@/helper/util';
import { NotificationsActiveOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

interface IProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  exam: ExamDisplayResponse;
}

const GradingNotificationDialog = ({ open, setOpen, exam }: IProps) => {
  const { t } = useTranslation('exam');

  if (!open || !exam) return null;

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      maxWidth={false}
      title={exam.title}
      renderContent={() => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
          <NotificationsActiveOutlined color="primary" fontSize="large" />
          <Typography variant="subtitle1">
            {t('Grading is in progress. When the grading is completed, you will be notified.')}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {t('Grading will be completed around 7 days after the exam ended.')}
            {exam.end_date && t('The end date is {{ date }}.', { date: formatYYYMMDD(exam.end_date) })}
          </Typography>
        </Box>
      )}
    />
  );
};

export default GradingNotificationDialog;
