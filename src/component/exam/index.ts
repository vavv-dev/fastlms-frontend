import i18next from '@/i18n';
import { atom } from 'jotai';
import { ReactElement } from 'react';

export { Card as ExamCard } from './Card';
export { Displays as ExamDisplays } from './Displays';
export { ReadyDialog as ExamReadyDialog } from './ReadyDialog';
export { View as ExamView } from './View';
export { Displays as GradingDisplays } from './grading/Displays';

// gettext no-op
void [
  i18next.t('general_exam', { ns: 'exam' }),
  i18next.t('midterm_exam', { ns: 'exam' }),
  i18next.t('final_exam', { ns: 'exam' }),
  i18next.t('assignment', { ns: 'exam' }),
  i18next.t('single_selection', { ns: 'exam' }),
  i18next.t('ox_selection', { ns: 'exam' }),
  i18next.t('text_input', { ns: 'exam' }),
  i18next.t('number_input', { ns: 'exam' }),
  i18next.t('essay', { ns: 'exam' }),

  i18next.t('ready', { ns: 'exam' }),
  i18next.t('in_progress', { ns: 'exam' }),
  i18next.t('timeout', { ns: 'exam' }),
  i18next.t('submitted', { ns: 'exam' }),
  i18next.t('grading', { ns: 'exam' }),
  i18next.t('failed', { ns: 'exam' }),
  i18next.t('passed', { ns: 'exam' }),
];

export const examMessageState = atom<ReactElement | null>(null);
