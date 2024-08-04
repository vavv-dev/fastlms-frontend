import i18next from '@/i18n';
import ExamView from './ExamView';
import UserExam from './UserExam';
import UserGrading from './UserGrading';

export { ExamView, UserExam, UserGrading };

// gettext no-op
void [
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
