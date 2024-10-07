import i18next from '@/i18n';

export { Home } from './Home';
export { Video as HomeVideo } from './Video';

void [
  i18next.t('video', { ns: 'home' }),
  i18next.t('short', { ns: 'home' }),
  i18next.t('playlist', { ns: 'home' }),
  i18next.t('asset', { ns: 'home' }),
  i18next.t('quiz', { ns: 'home' }),
  i18next.t('survey', { ns: 'home' }),
  i18next.t('exam', { ns: 'home' }),
  i18next.t('course', { ns: 'home' }),
];
