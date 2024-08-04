import i18next from '@/i18n';
import QuizViewDialog from './QuizViewDialog';
import UserQuiz from './UserQuiz';

export { QuizViewDialog, UserQuiz };

// gettext no-op
void [i18next.t('single_selection', { ns: 'quiz' }), i18next.t('number_input', { ns: 'quiz' })];
