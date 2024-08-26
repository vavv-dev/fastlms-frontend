import {
  VideoGetViewData as GetViewData,
  VideoGetViewResponse as GetViewResponse,
  videoGetDisplays as getDisplays,
  videoGetView as getView,
} from '@/api';
import { InfiniteScrollIndicator, useInfinitePagination, useServiceImmutable } from '@/component/common';
import { Box, Tab, Tabs } from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';

/**
 * tag custom protocol
 * all:videoId - all videos which have the same tag as the video
 *
 */

export const Related = ({ id }: { id: string }) => {
  const { t } = useTranslation('video');
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const [tagName, setTagName] = useState<string | null>(null);

  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    data: displays,
    isLoading,
    isValidating,
  } = useInfinitePagination({
    apiOptions: { tag: encodeURIComponent(tagName || `all:${id}`) },
    apiService: getDisplays,
    infiniteScrollRef,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'grid' }}>
        <Tabs
          sx={{ minHeight: '2em', '& .MuiButtonBase-root': { minHeight: '2em', minWidth: 'auto' } }}
          value={tagName}
          role="navigation"
          variant="scrollable"
          scrollButtons={true}
          allowScrollButtonsMobile
        >
          <Tab label={t('All')} value={null} onClick={() => setTagName(null)} />
          {data?.tag_names.map((name) => <Tab key={name} label={name} value={name} onClick={() => setTagName(name)} />)}
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {displays?.map((pagination) =>
          pagination.items.map((video) => (
            <Box key={video.id} onClick={() => setTagName(null)}>
              <Card
                data={video}
                hideAvatar
                sx={{ flexDirection: 'row', '& .card-banner': { width: '168px', minWidth: '168px', aspectRatio: '16 / 9' } }}
              />
            </Box>
          )),
        )}
      </Box>
      <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} small />
    </Box>
  );
};
