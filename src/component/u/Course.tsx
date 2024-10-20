import { School } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { EmptyMessage } from '@/component/common';

export const Course = () => {
  const { t } = useTranslation('u');
  return <EmptyMessage Icon={School} message={t('You does not enroll in any course yet.')} />;
};
