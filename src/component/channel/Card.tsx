import { Group } from '@mui/icons-material';
import { Avatar, Box, Chip, Tooltip, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  ChannelDisplayResponse as DisplayResponse,
  memberCreateMember as createMember,
  memberDeleteMember as deleteMember,
  channelGetDisplays as getDisplays,
} from '@/api';
import { updateInfiniteCache } from '@/component/common';
import { decodeURLText, formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';

export const Card = ({ channel }: { channel: DisplayResponse }) => {
  const { t } = useTranslation('channel');
  const user = useAtomValue(userState);
  const navigate = useNavigate();

  const toggleMembership = (e: React.MouseEvent) => {
    if (!user) return;

    e.stopPropagation();
    (channel.member_id
      ? deleteMember({ id: channel.member_id })
      : createMember({ requestBody: { channel_id: channel.id, user_id: user.id } })
    ).then((created) => {
      updateInfiniteCache<DisplayResponse>(
        getDisplays,
        { id: channel.id, member_id: created?.id, member_count: channel.member_count + (created ? 1 : -1) },
        'update',
      );
    });
  };

  return (
    <Box
      onClick={() => navigate(`/channel/${channel.owner.username}`)}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 1 }}
    >
      <Avatar sx={{ width: 100, height: 100 }} src={channel.thumbnail} />
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {channel.title || channel.owner.name}
      </Typography>
      <Typography component="div" variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '3em' }}>
        <Typography variant="subtitle2">{t(...formatRelativeTime(new Date(channel.modified)))}</Typography>
        {t('Member {{ num }}', { num: channel.member_count.toLocaleString() })}
        {user?.username == channel.owner.username ? (
          <Chip color="warning" size="small" label={t('Me')} />
        ) : (
          <Tooltip title={channel.member_id ? t('Member leave') : t('Member join')}>
            <Chip
              onClick={toggleMembership}
              size="small"
              icon={<Group />}
              color={channel.member_id ? 'primary' : 'default'}
              label={channel.member_id ? t('Joined') : t('Join')}
            />
          </Tooltip>
        )}
      </Typography>
      <Typography
        variant="body2"
        sx={{ ...textEllipsisCss(2), px: 1, whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{ __html: decodeURLText(channel.description) }}
      />
    </Box>
  );
};
