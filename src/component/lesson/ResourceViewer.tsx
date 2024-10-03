import { LessonEmbedResource as EmbedResource } from '@/api';
import { ReadyDialog } from '@/component/exam/ReadyDialog';
import { QuizViewDialog } from '@/component/quiz';
import { SurveyViewDialog } from '@/component/survey';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewDialog as ContentViewDialog } from './content/ViewDialog';

export const ResourceViewer = ({ resource: r }: { resource: EmbedResource }) => {
  const navigate = useNavigate();
  const [quizViewDialogOpen, setQuizViewDialogOpen] = useState(false);
  const [surveyViewDialogOpen, setSurveyViewDialogOpen] = useState(false);
  const [contentViewDialogOpen, setContentViewDialogOpen] = useState(false);
  const [examReadyDialogOpen, setExamReadyDialogOpen] = useState(false);

  return (
    <>
      <Typography
        onClick={(e) => {
          e.stopPropagation();
          const kind = r.kind;
          if (kind == 'video') navigate(`/video/${r.id}`);
          if (kind == 'quiz') setQuizViewDialogOpen(true);
          if (kind == 'survey') setSurveyViewDialogOpen(true);
          if (kind == 'content') setContentViewDialogOpen(true);
          if (kind == 'exam') setExamReadyDialogOpen(true);
        }}
        variant="subtitle1"
        sx={{ color: 'primary.main', cursor: 'pointer', lineHeight: 1, textDecoration: 'none' }}
      >
        {r.title}
      </Typography>
      {quizViewDialogOpen && <QuizViewDialog open={quizViewDialogOpen} setOpen={setQuizViewDialogOpen} id={r.id} />}
      {surveyViewDialogOpen && <SurveyViewDialog open={surveyViewDialogOpen} setOpen={setSurveyViewDialogOpen} id={r.id} />}
      {contentViewDialogOpen && <ContentViewDialog open={contentViewDialogOpen} setOpen={setContentViewDialogOpen} id={r.id} />}
      {examReadyDialogOpen && <ReadyDialog open={examReadyDialogOpen} setOpen={setExamReadyDialogOpen} id={r.id} />}
    </>
  );
};
