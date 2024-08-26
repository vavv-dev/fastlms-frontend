import i18next from '@/i18n';

export { View as CourseView } from './View';
export { Displays as CourseDisplays } from './Displays';

// gettext no-op
void [i18next.t('single_selection', { ns: 'quiz' }), i18next.t('number_input', { ns: 'quiz' })];
