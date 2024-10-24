import { LearningResourceKind, ThreadOwner } from '@/api';
import i18next from '@/i18n';

export { Displays as CommentDisplays } from './Displays';
export { Thread } from './Thread';
export { ThreadDialog } from './ThreadDialog';
export { UserComment } from './UserComment';

export interface ThreadProps {
  url: string;
  title: string;
  owner: ThreadOwner;
  resource_kind: LearningResourceKind;
  question?: boolean;
  sticky?: boolean;
  onLoad?: () => void;
}

// gettext no-op
void [
  i18next.t('video', { ns: 'comment' }),
  i18next.t('short', { ns: 'comment' }),
  i18next.t('exam', { ns: 'comment' }),
  i18next.t('course', { ns: 'comment' }),
  i18next.t('quiz', { ns: 'comment' }),
  i18next.t('survey', { ns: 'comment' }),
  i18next.t('lesson', { ns: 'comment' }),
  i18next.t('asset', { ns: 'comment' }),
];
