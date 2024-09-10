import {
  UserDisplayResponse as DisplayResponse,
  AccountGetDisplaysData as GetDisplaysData,
  accountGetDisplays as getDisplays,
  accountToggleFollow as toggleFollow,
} from '@/api';
import { GridInfiniteScrollPage, updateInfiniteCache } from '@/component/common';
import { formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import { StarOutlineOutlined, StarOutlined } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const Displays = () => {
  const { t } = useTranslation('channel');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="account"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'follower_count', label: t('Star count desc') },
      ]}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <ChannelCard key={item.id} channel={item} />))
      }
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(2, 210px)',
          sm: 'repeat(auto-fill, 251px)',
        },
      }}
      maxWidth="xl"
    />
  );
};

const ChannelCard = ({ channel }: { channel: DisplayResponse }) => {
  const { t } = useTranslation('channel');
  const user = useAtomValue(userState);
  const navigate = useNavigate();

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();

    toggleFollow({
      id: channel.id,
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { id: channel.id, followed: !channel.followed }, 'update');
    });
  };

  return (
    <Box
      onClick={() => navigate(`/u/${channel.username}`)}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 1 }}
    >
      <Avatar sx={{ width: 100, height: 100 }} src={channel.thumbnail} />
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {channel.name}
      </Typography>
      <Typography component="div" variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '3em' }}>
        <Typography variant="subtitle2">{t(...formatRelativeTime(new Date(channel.created)))}</Typography>
        {t('Stars {{ stars }}', { stars: channel.follower_count.toLocaleString() })}
        {user?.username !== channel.username && (
          <IconButton onClick={toggleStar}>{channel.followed ? <StarOutlined /> : <StarOutlineOutlined />}</IconButton>
        )}
      </Typography>
    </Box>
  );
};
