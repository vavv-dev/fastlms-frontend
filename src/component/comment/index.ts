import { LearningResourceKind, ThreadOwner } from '@/api';
import i18next from '@/i18n';
import CommentDialog from './CommentDialog';
import CommentThread from './CommentThread';
import UserComment from './UserComment';

export { CommentDialog, CommentThread, UserComment };

export interface ICommentThreadProps {
  url: string;
  title: string;
  owner: ThreadOwner;
  kind: LearningResourceKind,
  question?: boolean;
  sticky?: boolean;
}

// gettext no-op
void [
  i18next.t('video', { ns: 'comment' }),
  i18next.t('short', { ns: 'comment' }),
  i18next.t('exam', { ns: 'comment' }),
  i18next.t('course', { ns: 'comment' }),
  i18next.t('quiz', { ns: 'comment' }),
  i18next.t('survey', { ns: 'comment' }),
];
