import { QuizDisplayResponse } from '@/api';
import ResourceCard from '@/component/common/ResourceCard';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QuizActionMenu from './QuizActionMenu';
import QuizViewDialog from './QuizViewDialog';

interface IProps {
  quiz: QuizDisplayResponse;
  hideAvatar?: boolean;
}

const QuizCard = ({ quiz, hideAvatar }: IProps) => {
  const { t } = useTranslation('quiz');
  const [quizViewDialogOpen, setQuizViewDialogOpen] = useState(false);

  return (
    <>
      <ResourceCard
        resource={quiz}
        onClick={() => setQuizViewDialogOpen(true)}
        banner={
          <Box sx={{ p: 2 }}>
            <Typography variant="caption">{t('{{ count }} Question', { count: quiz.question_count })}</Typography>
            <Typography variant="subtitle1" sx={{ my: 2, lineHeight: 1.3, whiteSpace: 'pre-wrap', ...textEllipsisCss(3) }}>
              {quiz.description}
            </Typography>
          </Box>
        }
        score={quiz.score}
        passed={quiz.status == 'passed'}
        avatarChildren={[t(...formatRelativeTime(quiz.modified)), t('{{ count }} answers', { count: quiz.submission_count })]}
        hideAvatar={hideAvatar}
        actionMenu={<QuizActionMenu quiz={quiz} />}
        autoColor
      />
      {quizViewDialogOpen && <QuizViewDialog open={quizViewDialogOpen} setOpen={setQuizViewDialogOpen} quizId={quiz.id} />}
    </>
  );
};

export default QuizCard;
