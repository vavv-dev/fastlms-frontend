import {
  VideoDisplayResponse as DisplayResponse,
  videoGetDisplays as getDisplays,
  VideoGetDisplaysData as GetDisplaysData,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { Card } from '@/component/video/Card';
import { useTranslation } from 'react-i18next';

export const Video = () => {
  const { t } = useTranslation('video');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      disableSearch
      pageKey="video"
      orderingOptions={[
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Card
              key={item.id}
              data={{ ...item, video_kind: 'video' }}
              sx={{ mb: 2, '& .card-banner': { borderRadius: '16px', overflow: 'hidden' } }}
            />
          )),
        )
      }
      maxWidth={1928}
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 450px)',
          sm: 'repeat(auto-fill, minmax(308px, .8fr))',
          smm: 'repeat(auto-fill, minmax(308px, 1fr))',
        },
      }}
    />
  );
};
