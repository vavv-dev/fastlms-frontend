import { QuizAssessResponse, QuizGetAssessData, quizGetAssess, quizReadyAssess } from '@/api';
import { CommentThread } from '@/component/comment';
import { BaseDialog, useServiceImmutable } from '@/component/common';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, Collapse } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QuizForm from './QuizForm';
import QuizResult from './QuizResult';

interface IProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  quizId: string;
}

const QuizViewDialog = ({ open, setOpen, quizId }: IProps) => {
  const { t } = useTranslation('quiz');
  const { data: quiz, mutate } = useServiceImmutable<QuizGetAssessData, QuizAssessResponse>(quizGetAssess, {
    id: open ? quizId : '',
  });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  const readyQuiz = () => {
    if (!quiz) return;
    quizReadyAssess({ id: quiz.id }).then((updated: QuizAssessResponse) => {
      mutate(updated, { revalidate: false });
    });
  };

  if (!open || !quiz) return null;

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="sm"
      title={quiz.title}
      headerButtons={
        <Button
          size="small"
          onClick={() => setCommentDialogOpen((prev) => !prev)}
          startIcon={!commentDialogOpen ? <ArrowDropDown /> : <ArrowDropUp />}
          sx={{ flexShrink: 0 }}
        >
          {t('Q&A')}
        </Button>
      }
      renderContent={() => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 350,
            gap: 3,
            '& form, & form > fieldset': {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '1 0 0',
              width: '100%',
              gap: 3,
            },
          }}
        >
          {quiz.status == null ? (
            <>
              <Button variant="text" onClick={readyQuiz} endIcon={<KeyboardArrowRight />}>
                <Typography variant="h5">{t("Let's start the quiz!")}</Typography>
              </Button>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                {t("This quiz's cutoff percentage is {{ cutoff }} %.", { cutoff: quiz.cutoff_percent || 0 })}
              </Typography>
              <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', maxWidth: '100%', wordBreak: 'break-word' }}>
                {quiz.description}
              </Typography>
            </>
          ) : ['passed', 'failed'].includes(quiz.status) ? (
            <QuizResult quizId={quiz.id} />
          ) : (
            <QuizForm quizId={quiz.id} />
          )}

          <Collapse in={commentDialogOpen} unmountOnExit sx={{ width: '100%', p: 2 }}>
            <CommentThread
              url={encodeURIComponent(`${location.origin}/quiz/${quiz.id}`)}
              title={quiz.title}
              kind={quiz.kind}
              owner={quiz.owner}
              question={true}
              sticky={true}
            />
          </Collapse>
        </Box>
      )}
    />
  );
};

export default QuizViewDialog;
