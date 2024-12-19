import React from 'react';

import { AssetViewDialog } from '@/component/asset';
import { ExamViewDialog } from '@/component/exam';
import { LessonViewDialog } from '@/component/lesson';
import { QuizViewDialog } from '@/component/quiz';
import { SurveyViewDialog } from '@/component/survey';

const DIALOG_COMPONENT = {
  asset: AssetViewDialog,
  quiz: QuizViewDialog,
  survey: SurveyViewDialog,
  exam: ExamViewDialog,
  lesson: LessonViewDialog,
} as const;

type Kind = keyof typeof DIALOG_COMPONENT;

interface ViewDialogProps {
  id: string;
  kind: Kind;
  open: boolean;
  onClose: () => void;
}

export const ViewDialog: React.FC<ViewDialogProps> = ({ id, kind, open, onClose }) => {
  const Component = DIALOG_COMPONENT[kind];

  if (!open) return null;

  return <Component id={id} open={open} setOpen={onClose} />;
};
