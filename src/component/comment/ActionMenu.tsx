import {
  CommentDisplayResponse as DisplayResponse,
  CommentGetThreadData as GetThreadData,
  ThreadResponse,
  commentGetDisplays as getDisplays,
  commentGetThread as getThread,
  commentToggleAction as toggleAction,
  commentUpdateResource as updateResource,
} from '@/api';
import { ResourceActionMenu, createToggleAction, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { userState } from '@/store';
import {
  BookmarkAddOutlined,
  BookmarkRemoveOutlined,
  EditOutlined,
  FlagOutlined,
  PushPinOutlined,
  QuestionMarkOutlined,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

interface Props {
  url: string;
  data: DisplayResponse;
  onEdit: () => void;
}

const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays, true);

export const ActionMenu = ({ url, data, onEdit }: Props) => {
  const { t } = useTranslation('comment');
  const user = useAtomValue(userState);
  const { data: thread } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, { url });

  const toggleField = (field: 'is_question' | 'pinned' | 'deleted') => {
    updateResource({
      id: data.id,
      requestBody: {
        [field]: !data[field],
      },
    }).then(() => {
      const isPin = field === 'pinned' && !data[field];
      updateInfiniteCache<DisplayResponse>(getDisplays, { ...data, [field]: !data[field] }, 'update', 'children', isPin);
    });
  };

  if (!user) return null;

  return (
    <ResourceActionMenu
      menuItems={[
        <MenuItem key="bookmark" onClick={() => action('bookmark', data)}>
          <ListItemIcon>{data.bookmarked ? <BookmarkRemoveOutlined /> : <BookmarkAddOutlined />}</ListItemIcon>
          {data.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
        </MenuItem>,
        user.username === data.author.username && [
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
            {data.is_question ? t('Change to comment') : t('Change to question')}
          </MenuItem>,
        ],
        <MenuItem key="flag" onClick={() => action('flag', data)}>
          <ListItemIcon>
            <FlagOutlined color={data.flagged ? 'error' : 'inherit'} />
          </ListItemIcon>
          {data.flagged ? t('Unflag') : t('Flag')}
        </MenuItem>,
        user.username === thread?.owner.username && [
          <MenuItem key="pin" onClick={() => toggleField('pinned')}>
            <ListItemIcon>
              <PushPinOutlined />
            </ListItemIcon>
            {data.pinned ? t('Unpin') : t('Pin')}
          </MenuItem>,
        ],
      ]}
    />
  );
};
