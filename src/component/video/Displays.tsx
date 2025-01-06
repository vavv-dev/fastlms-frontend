import { ElectricBolt, VideoLibrary } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';
import { ImportYoutubeDialog } from './ImportYoutubeDialog';

import {
  VideoDisplayResponse as DisplayResponse,
  videoGetDisplays as getDisplays,
  VideoGetDisplaysData as GetDisplaysData,
  VideoKind,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';

export const Displays = ({ kind }: { kind: VideoKind }) => {
  const { t } = useTranslation('video');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="video"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={({ open, setOpen }) => <ImportYoutubeDialog open={open} setOpen={setOpen} kind="video" />}
      apiService={getDisplays}
      apiOptions={{ subKind: kind }}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Card
              key={item.id}
              data={item}
              hideAvatar
              sx={kind == 'short' ? { '& .card-banner': { borderRadius: '16px', overflow: 'hidden' } } : {}}
            />
          )),
        )
      }
      emptyMessage={
        <EmptyMessage
          Icon={kind === 'video' ? VideoLibrary : ElectricBolt}
          message={kind === 'video' ? t('No video found.') : t('No short found.')}
        />
      }
      gridBoxSx={
        kind === 'video'
          ? {
              gap: '2em 1em',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                mobile: 'repeat(1, 344px)',
                sm: 'repeat(auto-fill, 251px)',
                lg: 'repeat(4, minmax(251px, 308px))',
              },
            }
          : {
              gap: '2em 4px',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                mobile: 'repeat(1, 344px)',
                sm: 'repeat(auto-fill, 210px)',
              },
            }
      }
    />
  );
};
