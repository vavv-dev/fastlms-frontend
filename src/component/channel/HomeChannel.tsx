import { VideoCameraFront } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { ChannelCard } from '.';

import {
  ChannelDisplayResponse as DisplayResponse,
  ChannelGetDisplaysData as GetDisplaysData,
  channelGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';

export const HomeChannel = () => {
  const { t } = useTranslation('channel');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="account"
      orderingOptions={[{ value: 'created', label: t('Recently created') }]}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <ChannelCard key={item.id} channel={item} />))
      }
      emptyMessage={<EmptyMessage Icon={VideoCameraFront} message={t('No channel found.')} />}
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(auto-fill, minmax(200px, 1fr))',
        },
      }}
    />
  );
};
