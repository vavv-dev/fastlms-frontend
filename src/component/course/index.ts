import i18next from '@/i18n';

export { Card as CourseCard } from './Card';
export { Displays as CourseDisplays } from './Displays';
export { Outline as CourseOutline } from './Outline';
export { View as CourseView } from './View';

// gettext no-op
void [
  i18next.t('single_selection', { ns: 'course' }),
  i18next.t('number_input', { ns: 'course' }),
  i18next.t('video', { ns: 'course' }),
  i18next.t('quiz', { ns: 'course' }),
  i18next.t('survey', { ns: 'course' }),
  i18next.t('content', { ns: 'course' }),
  i18next.t('exam', { ns: 'course' }),
];
