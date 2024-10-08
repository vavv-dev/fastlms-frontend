import i18next from '@/i18n';

export { Displays as LessonDisplays } from './Displays';
export { ResourceViewer } from './ResourceViewer';
export { Card as LessonCard } from './Card';

const t = i18next.t;

// i18next noop
void [
  t('video', { ns: 'lesson' }),
  t('quiz', { ns: 'lesson' }),
  t('survey', { ns: 'lesson' }),
  t('exam', { ns: 'lesson' }),
  t('content', { ns: 'lesson' }),
];
