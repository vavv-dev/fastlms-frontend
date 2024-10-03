import {
  VideoDisplayResponse as DisplayResponse,
  videoGetDisplays as getDisplays,
  VideoGetDisplaysData as GetDisplaysData,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { Card } from './Card';
import { ImportYoutubeDialog } from './ImportYoutubeDialog';

export const Displays = () => {
  const { t } = useTranslation('video');
  const location = useLocation();
  const kind = location.pathname.split('/').pop();

  if (kind !== 'video' && kind !== 'short') {
    return <Navigate to="/404" />;
  }

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="video"
      orderingOptions={[
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      CreateItemComponent={({ open, setOpen }) => <ImportYoutubeDialog open={open} setOpen={setOpen} kind={'video'} />}
      apiService={getDisplays}
      apiOptions={{ videoKind: kind }}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Card
              key={item.id}
              data={item}
              hideAvatar={true}
              sx={kind == 'short' ? { '& .card-banner': { borderRadius: '16px', overflow: 'hidden' } } : {}}
            />
          )),
        )
      }
      gridBoxSx={
        kind === 'video'
          ? {
              gap: '2em 1em',
              gridTemplateColumns: {
                xs: 'repeat(1, 344px)',
                sm: 'repeat(auto-fill, 251px)',
                lg: 'repeat(4, minmax(251px, 308px))',
              },
            }
          : {
              gap: '2em 4px',
              gridTemplateColumns: {
                xs: 'repeat(1, 344px)',
                sm: 'repeat(auto-fill, 210px)',
              },
            }
      }
    />
  );
};
