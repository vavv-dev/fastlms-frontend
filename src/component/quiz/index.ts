import i18next from '@/i18n';

export { ViewDialog as QuizViewDialog } from './ViewDialog';
export { Displays as QuizDisplays } from './Displays';

// gettext no-op
void [i18next.t('single_selection', { ns: 'quiz' }), i18next.t('number_input', { ns: 'quiz' })];
