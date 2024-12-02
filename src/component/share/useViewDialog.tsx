import { useCallback, useState } from 'react';

import { AssetViewDialog } from '@/component/asset';
import { ExamViewDialog } from '@/component/exam';
import { LessonViewDialog } from '@/component/lesson';
import { QuizViewDialog } from '@/component/quiz';
import { SurveyViewDialog } from '@/component/survey';

interface UseViewDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  Dialog: React.FC;
}

const DIALOG_COMPONENT = {
  asset: AssetViewDialog,
  quiz: QuizViewDialog,
  survey: SurveyViewDialog,
  exam: ExamViewDialog,
  lesson: LessonViewDialog,
};

type Kind = keyof typeof DIALOG_COMPONENT;

export const useViewDialog = (id: string, kind: Kind): UseViewDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const Component = DIALOG_COMPONENT[kind];
  const Dialog = useCallback(() => (isOpen ? <Component id={id} open setOpen={close} /> : null), [isOpen, id, close, Component]);

  return { isOpen, open, close, toggle, Dialog };
};
