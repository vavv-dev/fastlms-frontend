import { EditOutlined, FlagOutlined, PushPinOutlined, QuestionMarkOutlined, RemoveCircleOutline } from '@mui/icons-material';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import {
  CommentDisplayResponse as DisplayResponse,
  PublicGetThreadData as GetThreadData,
  ThreadResponse,
  publicGetComments as getDisplays,
  publicGetThread as getThread,
  commentToggleAction as toggleAction,
  commentUpdateResource as updateResource,
} from '@/api';
import { ResourceActionMenu, createToggleAction, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { userState } from '@/store';

interface Props {
  url: string;
  data: DisplayResponse;
  onEdit: () => void;
  disableSelect?: boolean;
  ratingMode?: boolean;
}

export const ActionMenu = ({ url, data, onEdit, disableSelect, ratingMode }: Props) => {
  const { t } = useTranslation('comment');
  const user = useAtomValue(userState);
  const { data: thread } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, { url, ratingMode });

  const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays, true);

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
          !disableSelect && (
            <MenuItem key="question" onClick={() => toggleField('is_question')}>
              <ListItemIcon>
                <QuestionMarkOutlined />
              </ListItemIcon>
              {data.is_question ? t('Change to comment') : t('Change to question')}
            </MenuItem>
          ),
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
