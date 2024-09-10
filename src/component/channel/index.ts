import i18next from '@/i18n';

export { Home as ChannelHome } from './Home';
export { Displays as ChannelDisplays } from './Displays';

void [
  i18next.t('video', { ns: 'channel' }),
  i18next.t('short', { ns: 'channel' }),
  i18next.t('playlist', { ns: 'channel' }),
  i18next.t('quiz', { ns: 'channel' }),
  i18next.t('survey', { ns: 'channel' }),
  i18next.t('exam', { ns: 'channel' }),
  i18next.t('course', { ns: 'channel' }),
];
