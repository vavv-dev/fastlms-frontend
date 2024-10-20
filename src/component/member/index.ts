import i18next from '@/i18n';

export { Displays as MemberDisplays } from './Displays';
export { InvitationAccept } from './InvitationAccept';

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

  i18next.t('username', { ns: 'member' }),
  i18next.t('email', { ns: 'member' }),
  i18next.t('name', { ns: 'member' }),
  i18next.t('cellphone', { ns: 'member' }),
  i18next.t('birthdate', { ns: 'member' }),
  i18next.t('company', { ns: 'member' }),
  i18next.t('position', { ns: 'member' }),
  i18next.t('department', { ns: 'member' }),
];
