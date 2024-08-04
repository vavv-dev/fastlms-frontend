import { QuizDisplayResponse } from '@/api';
import ResourceCard from '@/component/common/ResourceCard';
import { snackbarMessageState } from '@/component/layout';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { ReplyAllOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
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
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
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
            <Tooltip title={t('Share quiz link')} arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/quiz/${quiz.id}`).then(() => {
                    setSnackbarMessage({ message: t('Quiz link copied'), duration: 2000 });
                  });
                }}
                sx={{ position: 'absolute', right: 4, bottom: 4 }}
              >
                <ReplyAllOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
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
