import { LearningResourceKind, ThreadOwner } from '@/api';
import i18next from '@/i18n';

export { Displays as CommentDisplays } from './Displays';
export { QnADisplays } from './QnADisplays';
export { Thread } from './Thread';
export { ThreadDialog } from './ThreadDialog';
export { UserComment } from './UserComment';

export interface ThreadProps {
  url: string;
  title: string;
  thumbnail: string;
  owner: ThreadOwner;
  resource_kind: LearningResourceKind;
  question?: boolean;
  editor?: boolean;
  sticky?: boolean;
  refresh?: boolean;
  hideHeader?: boolean;
  disableSelect?: boolean;
  disableReply?: boolean;
  ratingMode?: boolean;
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
  i18next.t('channel', { ns: 'comment' }),
];
