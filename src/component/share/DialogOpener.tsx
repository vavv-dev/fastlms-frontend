import { useLocation, useNavigate } from 'react-router-dom';

import { AssetViewDialog } from '@/component/asset';
import { ThreadDialog } from '@/component/comment';
import { CourseEnrollDialog } from '@/component/course';
import { ExamReadyDialog } from '@/component/exam';
import { LessonViewDialog } from '@/component/lesson';
import { QuizViewDialog } from '@/component/quiz';
import { SurveyViewDialog } from '@/component/survey';

export const DialogOpener = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    navigate(-1);
  };

  const dialog = location.state?.dialog;
  if (!dialog) return null;

  // Thread instance
  if (dialog.kind === 'thread') {
    return <ThreadDialog open={true} setOpen={handleClose} threadProps={{ ...dialog, sticky: true }} />;
  }

  // Learning resource's comment thread
  if (dialog.question != undefined) {
    return (
      <ThreadDialog
        open={true}
        setOpen={handleClose}
        threadProps={{
          ...dialog,
          url: encodeURIComponent(`${window.location.origin}/${dialog.kind}/${dialog.id}`),
          resource_kind: dialog.kind,
          sticky: true,
        }}
      />
    );
  }

  const DialogComponent = {
    quiz: QuizViewDialog,
    survey: SurveyViewDialog,
    asset: AssetViewDialog,
    exam: ExamReadyDialog,
    lesson: LessonViewDialog,
    course: CourseEnrollDialog,
  }[dialog.kind as 'quiz' | 'survey' | 'asset' | 'exam' | 'lesson' | 'course'];

  if (!DialogComponent) return null;

  return <DialogComponent id={dialog.id} open={true} setOpen={handleClose} />;
};
