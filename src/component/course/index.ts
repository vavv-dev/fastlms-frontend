import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

import { ResourceLocation } from '@/api';
import i18next from '@/i18n';

export { ActionMenu as CourseActionMenu } from './ActionMenu';
export { Card as CourseCard } from './Card';
export { Displays as CourseDisplays } from './Displays';
export { EnrollDialog as CourseEnrollDialog } from './EnrollDialog';
export { Outline as CourseOutline } from './Outline';
export { Player as CoursePlayer } from './player/Player';
export { UserCourse } from './UserCourse';
export { View as CourseView } from './View';

// gettext no-op
void [
  i18next.t('single_selection', { ns: 'course' }),
  i18next.t('number_input', { ns: 'course' }),
  i18next.t('video', { ns: 'course' }),
  i18next.t('quiz', { ns: 'course' }),
  i18next.t('survey', { ns: 'course' }),
  i18next.t('content', { ns: 'course' }),
  i18next.t('exam', { ns: 'course' }),
  i18next.t('asset', { ns: 'course' }),

  i18next.t('beginner', { ns: 'course' }),
  i18next.t('intermediate', { ns: 'course' }),
  i18next.t('advanced', { ns: 'course' }),
  i18next.t('general', { ns: 'course' }),
];

type CertificateStatus = 'notEligible' | 'eligible' | 'requested' | 'issued';

export const certificateStatusFamily = atomFamily(() => atom<CertificateStatus>('notEligible'));
export const courseResourceLocationState = atom<ResourceLocation | null>(null);
export const courseExamResetState = atom<string | null>(null);
