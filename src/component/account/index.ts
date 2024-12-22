import { atom } from 'jotai';

import i18next from '@/i18n';

export { EmailVerification } from './EmailVerification';
export { Join } from './Join';
export { Login } from './Login';
export { LoginButton } from './LoginButton';
export { Logout } from './Logout';
export { PasswordReset } from './PasswordReset';
export { PasswordResetConfirm } from './PasswordResetConfirm';
export { UserBookmark } from './u/UserBookmark';
export { UserHistory } from './u/UserHistory';
export { UserLayout } from './u/UserLayout';
export { UserProfile } from './u/UserProfile';
export { useForceLogout } from './useForceLogout';

export const accountProcessingState = atom<boolean>(false);

// gettext noop
void [
  i18next.t('video', { ns: 'account' }),
  i18next.t('short', { ns: 'account' }),
  i18next.t('playlist', { ns: 'account' }),
  i18next.t('quiz', { ns: 'account' }),
  i18next.t('survey', { ns: 'account' }),
  i18next.t('exam', { ns: 'account' }),
  i18next.t('lesson', { ns: 'account' }),
  i18next.t('asset', { ns: 'account' }),
  i18next.t('course', { ns: 'account' }),
];
