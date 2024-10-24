import { atom } from 'jotai';

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

export const accountProcessingState = atom<boolean>(false);
