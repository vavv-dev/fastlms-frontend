import { atom } from 'jotai';

import i18next from '@/i18n';

export { Displays as MemberDisplays } from './Displays';
export { InvitationAccept } from './InvitationAccept';

export const memberSearchState = atom<string>('');

const t = i18next.t;

void [
  t('add_member', { ns: 'member' }),
  t('update_member', { ns: 'member' }),
  t('skip_member', { ns: 'member' }),
  t('add_roster', { ns: 'member' }),
  t('update_roster', { ns: 'member' }),
  t('skip_roster', { ns: 'member' }),
  t('row_error', { ns: 'member' }),
  t('invalid_username', { ns: 'member' }),
  t('duplicate_username', { ns: 'member' }),
  t('email_conflict', { ns: 'member' }),
  t('invalid_email', { ns: 'member' }),
  t('duplicate_email', { ns: 'member' }),
  t('database_error', { ns: 'member' }),

  t('username', { ns: 'member' }),
  t('email', { ns: 'member' }),
  t('name', { ns: 'member' }),
  t('cellphone', { ns: 'member' }),
  t('birthdate', { ns: 'member' }),
  t('company', { ns: 'member' }),
  t('position', { ns: 'member' }),
  t('department', { ns: 'member' }),

  t('video', { ns: 'member' }),
  t('short', { ns: 'member' }),
  t('playlist', { ns: 'member' }),
  t('asset', { ns: 'member' }),
  t('quiz', { ns: 'member' }),
  t('survey', { ns: 'member' }),
  t('exam', { ns: 'member' }),
  t('lesson', { ns: 'member' }),
  t('course', { ns: 'member' }),
];
