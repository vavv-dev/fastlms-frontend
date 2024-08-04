import {
  CommentDisplayResponse,
  CommentGetThreadData,
  ThreadResponse,
  commentGetDisplay,
  commentGetThread,
  commentToggleAction,
  commentUpdateResource,
} from '@/api';
import { ResourceActionMenu, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { userState } from '@/store';
import { EditOutlined, FlagOutlined, PushPinOutlined, QuestionMarkOutlined, RemoveCircleOutline } from '@mui/icons-material';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

interface Props {
  url: string;
  comment: CommentDisplayResponse;
  onEdit: () => void;
}

const CommentActionMenu = ({ url, comment, onEdit }: Props) => {
  const { t } = useTranslation('comment');
  const user = useAtomValue(userState);
  const { data: thread } = useServiceImmutable<CommentGetThreadData, ThreadResponse>(commentGetThread, { url });

  const toggleField = (field: 'is_question' | 'pinned' | 'deleted') => {
    commentUpdateResource({
      id: comment.id,
      requestBody: {
        [field]: !comment[field],
      },
    }).then(() => {
      const isPin = field === 'pinned' && !comment[field];
      updateInfiniteCache<CommentDisplayResponse>(
        commentGetDisplay,
        { ...comment, [field]: !comment[field] },
        'update',
        'children',
        isPin,
      );
    });
  };

  const toggleFlag = () => {
    commentToggleAction({ id: comment.id, action: 'flag' }).then(() => {
      updateInfiniteCache<CommentDisplayResponse>(
        commentGetDisplay,
        { ...comment, flagged: !comment.flagged, flag_count: comment.flag_count + (comment.flagged ? -1 : 1) },
        'update',
        'children',
      );
    });
  };

  if (!user) return null;

  return (
    <ResourceActionMenu
      menuItems={[
        user.username === comment.author.username && [
          <MenuItem key="edit" onClick={onEdit}>
            <ListItemIcon>
              <EditOutlined />
            </ListItemIcon>
            {t('Edit')}
          </MenuItem>,
          <MenuItem key="delete" onClick={() => toggleField('deleted')}>
            <ListItemIcon>
              <RemoveCircleOutline />
            </ListItemIcon>
            {t('Delete')}
          </MenuItem>,
          <MenuItem key="question" onClick={() => toggleField('is_question')}>
            <ListItemIcon>
              <QuestionMarkOutlined />
            </ListItemIcon>
            {comment.is_question ? t('Change to comment') : t('Change to question')}
          </MenuItem>,
        ],
        <MenuItem key="flag" onClick={toggleFlag}>
          <ListItemIcon>
            <FlagOutlined color={comment.flagged ? 'error' : 'inherit'} />
          </ListItemIcon>
          {comment.flagged ? t('Unflag') : t('Flag')}
        </MenuItem>,
        user.username === thread?.owner.username && [
          <MenuItem key="pin" onClick={() => toggleField('pinned')}>
            <ListItemIcon>
              <PushPinOutlined />
            </ListItemIcon>
            {comment.pinned ? t('Unpin') : t('Pin')}
          </MenuItem>,
        ],
      ]}
    />
  );
};

export default CommentActionMenu;
