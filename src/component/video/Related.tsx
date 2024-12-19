import { LocalOfferOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';

import {
  VideoGetViewData as GetViewData,
  VideoGetViewResponse as GetViewResponse,
  videoGetDisplays as getDisplays,
  videoGetView as getView,
} from '@/api';
import { EmptyMessage, InfiniteScrollIndicator, TagGroup, useInfinitePagination, useServiceImmutable } from '@/component/common';

/**
 * all:videoId - all videos which have the same tag as the video
 */

export const Related = ({ id }: { id: string }) => {
  const { t } = useTranslation('video');
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const [tag, setTag] = useState<string>('');

  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    data: displays,
    isLoading,
    isValidating,
  } = useInfinitePagination({
    apiOptions: { tag: encodeURIComponent(tag || `all:${id}`) },
    apiService: getDisplays,
    infiniteScrollRef,
  });

  const tags = useMemo(() => [['', t('All')], ...(data?.tag_names?.map((tag) => [tag, tag]) ?? [])], [data, t]);

  if (data?.tag_names?.length == 0) return <EmptyMessage Icon={LocalOfferOutlined} message={t('No related videos')} />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TagGroup tags={tags} tag={tag} setTag={setTag} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {displays?.map((pagination) =>
          pagination.items.map((video) => (
            <Box key={video.id} onClick={() => setTag('')}>
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
