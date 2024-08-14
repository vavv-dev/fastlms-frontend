import { VideoDisplayResponse, videoGetDisplay, VideoGetDisplayData } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import ImportYoutubeDialog from './coms/ImportYoutubeDialog';
import VideoCard from './VideoCard';

const UserVideo = () => {
  const { t } = useTranslation('video');
  const location = useLocation();
  const sharedItemTabKey = 'bookmarker';
  const videoKind = location.pathname.split('/').pop();

  if (videoKind !== 'video' && videoKind !== 'short') {
    return <Navigate to="/404" />;
  }

  return (
    <GridInfiniteScrollPage<VideoDisplayResponse, VideoGetDisplayData>
      pageKey="video"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Video I watched'),
        ownedItemTabLabel: t('My video'),
      }}
      orderingOptions={[
        { value: 'watched_at', label: t('Recently watch') },
        { value: 'title', label: t('Title asc') },
      ]}
      CreateItemComponent={({ open, setOpen }) => <ImportYoutubeDialog open={open} setOpen={setOpen} kind={'video'} />}
      apiService={videoGetDisplay}
      apiOptions={{ videoKind: videoKind }}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <VideoCard
              key={item.id}
              video={item}
              hideAvatar={tab != sharedItemTabKey}
              sx={videoKind == 'short' ? { '& .card-banner': { borderRadius: '16px', overflow: 'hidden' } } : {}}
            />
          )),
        )
      }
      gridBoxSx={
        videoKind === 'video'
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

export default UserVideo;
