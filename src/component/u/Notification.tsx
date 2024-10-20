import { EmptyMessage } from '@/component/common';
import { NotificationsOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export const Notification = () => {
  const { t } = useTranslation('u');
  return <EmptyMessage Icon={NotificationsOutlined} message={t('You have no notification yet.')} />;
};
