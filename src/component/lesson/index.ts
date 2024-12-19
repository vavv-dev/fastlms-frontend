import i18next from '@/i18n';

export { Card as LessonCard } from './Card';
export { Displays as LessonDisplays } from './Displays';
export { ViewDialog as LessonViewDialog } from './ViewDialog';

const t = i18next.t;

// i18next noop
void [
  t('video', { ns: 'lesson' }),
  t('quiz', { ns: 'lesson' }),
  t('survey', { ns: 'lesson' }),
  t('exam', { ns: 'lesson' }),
  t('content', { ns: 'lesson' }),
];
