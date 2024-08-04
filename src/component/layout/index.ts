import i18next from '@/i18n';
import { parseLocalStorage } from '@/helper/util';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import BaseLayout from './BaseLayout';
import { AlertProps } from '@mui/material';

/**
 *
 * page component
 *
 */
export { BaseLayout };

/**
 *
 * store
 *
 */
export const navState = atomWithStorage<boolean>('navOpen', parseLocalStorage('navOpen', false));
export const spacerRefState = atom<HTMLElement | null>(null);

interface Alert {
  open: boolean;
  message: React.ReactNode;
  severity: AlertProps['severity'];
  hideClose?: boolean;
  duration?: number;
}
export const alertState = atom<Alert>({
  open: false,
  message: '',
  severity: 'success',
  hideClose: false,
  duration: 5000,
});

// snackbar message
interface ISnackBarMessage {
  message: string;
  duration: number;
  action?: React.ReactNode;
}
export const snackbarMessageState = atom<ISnackBarMessage | null>(null);

// gettext no-op
void [i18next.t('Profile', { ns: 'layout' }), i18next.t('Logout', { ns: 'layout' })];
