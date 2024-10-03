import {
  ChannelDisplayResponse as DisplayResponse,
  ChannelGetDisplaysData as GetDisplaysData,
  memberCreateMember as createMember,
  memberDeleteMember as deleteMember,
  channelGetDisplays as getDisplays,
} from '@/api';
import { GridInfiniteScrollPage, updateInfiniteCache } from '@/component/common';
import { formatRelativeTime, stripHtml, textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';
import { Group } from '@mui/icons-material';
import { Avatar, Box, Chip, Tooltip, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const Channel = () => {
  const { t } = useTranslation('home');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="account"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'name', label: t('Name asc') },
      ]}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <ChannelCard key={item.id} channel={item} />))
      }
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(auto-fill, minmax(200px, 1fr))',
        },
      }}
      boxPadding={0}
    />
  );
};

const ChannelCard = ({ channel }: { channel: DisplayResponse }) => {
  const { t } = useTranslation('home');
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
      onClick={() => navigate(`/channel/${channel.username}`)}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 1 }}
    >
      <Avatar sx={{ width: 100, height: 100 }} src={channel.thumbnail} />
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {channel.name}
      </Typography>
      <Typography component="div" variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '3em' }}>
        <Typography variant="subtitle2">{t(...formatRelativeTime(new Date(channel.created)))}</Typography>
        {t('Member {{ num }}', { num: channel.member_count.toLocaleString() })}
        {user?.username !== channel.username && (
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
      <Typography variant="caption" sx={{ ...textEllipsisCss(2), px: 1 }}>
        {stripHtml(channel.description)}
      </Typography>
    </Box>
  );
};
