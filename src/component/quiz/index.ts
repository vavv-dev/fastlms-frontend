import i18next from '@/i18n';

export { Card as QuizCard } from './Card';
export { Displays as QuizDisplays } from './Displays';
export { View as QuizView } from './View';
export { ViewDialog as QuizViewDialog } from './ViewDialog';

// gettext no-op
void [i18next.t('single_selection', { ns: 'quiz' }), i18next.t('number_input', { ns: 'quiz' })];
