import { AlertProps } from '@mui/material';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { parseLocalStorage } from '@/helper/util';
import i18next from '@/i18n';

export { BaseLayout } from './BaseLayout';
export { GlobalAlert } from './GlobalAlert';
export { StrictTabControl } from './StrictTabControl';

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
interface SnackBarMessage {
  message: React.ReactNode;
  duration: number;
  action?: React.ReactNode;
}
export const snackbarMessageState = atom<SnackBarMessage | null>(null);

// gettext no-op
void [i18next.t('Profile', { ns: 'layout' }), i18next.t('Logout', { ns: 'layout' })];
