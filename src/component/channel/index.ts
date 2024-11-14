import i18next from '@/i18n';

export { Card as ChannelCard } from './Card';
export { DynamicRoot as ChannelRoot } from './DynamicRoot';
export { Home as ChannelHome } from './Home';
export { HomeChannel } from './HomeChannel';
export { Layout as ChannelLayout } from './Layout';
export { Setting as ChannelSetting } from './Setting';
export { UserChannel } from './UserChannel';

void [
  i18next.t('home', { ns: 'channel' }),
  i18next.t('video', { ns: 'channel' }),
  i18next.t('short', { ns: 'channel' }),
  i18next.t('playlist', { ns: 'channel' }),
  i18next.t('asset', { ns: 'channel' }),
  i18next.t('quiz', { ns: 'channel' }),
  i18next.t('survey', { ns: 'channel' }),
  i18next.t('exam', { ns: 'channel' }),
  i18next.t('course', { ns: 'channel' }),
  i18next.t('lesson', { ns: 'channel' }),
  i18next.t('qna', { ns: 'channel' }),

  i18next.t('username', { ns: 'channel' }),
  i18next.t('email', { ns: 'channel' }),
  i18next.t('name', { ns: 'channel' }),
  i18next.t('cellphone', { ns: 'channel' }),
  i18next.t('birthdate', { ns: 'channel' }),
  i18next.t('company', { ns: 'channel' }),
  i18next.t('position', { ns: 'channel' }),
  i18next.t('department', { ns: 'channel' }),
];
