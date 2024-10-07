import i18next from '@/i18n';

export { Bookmark as UserBookmark } from './Bookmark';
export { Certificate as UserCertificate } from './Certificate';
export { Channel as UserChannel } from './Channel';
export { Comment as UserComment } from './Comment';
export { History as UserHistory } from './History';
export { Layout as UserLayout } from './Layout';
export { Notification as UserNotification } from './Notification';
export { Profile } from './Profile';

void [
  i18next.t('Bookmark', { ns: 'u' }),
  i18next.t('Comment', { ns: 'u' }),
  i18next.t('Channel', { ns: 'u' }),
  i18next.t('Certificate', { ns: 'u' }),
  i18next.t('Profile', { ns: 'u' }),

  i18next.t('video', { ns: 'u' }),
  i18next.t('short', { ns: 'u' }),
  i18next.t('playlist', { ns: 'u' }),
  i18next.t('asset', { ns: 'u' }),
  i18next.t('exam', { ns: 'u' }),
  i18next.t('lesson', { ns: 'u' }),
  i18next.t('course', { ns: 'u' }),
  i18next.t('quiz', { ns: 'u' }),
  i18next.t('survey', { ns: 'u' }),
];
