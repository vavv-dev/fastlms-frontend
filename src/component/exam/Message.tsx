import { ArrowForwardOutlined } from '@mui/icons-material';
import { Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ExamAttemptContext } from '@/api';

export const Message = ({ id, title, context }: { id: string; title: string; context?: ExamAttemptContext | null }) => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();

  return (
    <Link
      underline="hover"
      component="button"
      sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'inherit' }}
      onClick={() => {
        if (context) {
          const playerPath = `/course/${context.course_id}/player`;
          navigate(playerPath, {
            state: { resourceLocation: { lesson_id: context.lesson_id, resource_id: id } },
            // Do not use useLocation's pathname
            replace: window.location.pathname.includes(playerPath),
          });
        } else {
          navigate(`/exam/${id}`);
        }
      }}
    >
      <span>{title}</span>
      <span>{`${t('Exam is in progress.')}`}</span>
      <ArrowForwardOutlined fontSize="small" />
    </Link>
  );
};
