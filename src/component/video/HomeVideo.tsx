import { VideoLibrary } from '@mui/icons-material';
import { atom, useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { VideoCard } from '.';

import {
  VideoDisplayResponse as DisplayResponse,
  videoGetDisplays as getDisplays,
  VideoGetDisplaysData as GetDisplaysData,
  videoGetTags as getTags,
  VideoGetTagsData as GetTagsData,
  VideoGetTagsResponse as GetTagsResponse,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, TagGroup, useServiceImmutable } from '@/component/common';

const tagState = atom<string>('');

export const HomeVideo = () => {
  const { t } = useTranslation('video');
  const { data: tagNames } = useServiceImmutable<GetTagsData, GetTagsResponse>(getTags, { limit: 8 });
  const [tag, setTag] = useAtom(tagState);

  const tags = useMemo(
    () => [
      ['', t('All')],
      ['featured', t('Featured')],
      ['watched', t('Watched videos')],
      ...(tagNames?.map((tag) => [tag, tag]) ?? []),
    ],
    [tagNames, t],
  );

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      disableSearch
      pageKey="video"
      apiService={getDisplays}
      apiOptions={{ tag: tag ? encodeURIComponent(tag) : null, size: 24 }}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <VideoCard
              key={item.id}
              data={{ ...item, sub_kind: 'video' }}
              sx={{ mb: 2, '& .card-banner': { borderRadius: '16px', overflow: 'hidden' } }}
            />
          )),
        )
      }
      emptyMessage={<EmptyMessage Icon={VideoLibrary} message={t('No video found.')} />}
      maxWidth={1928}
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, minmax(0, 1fr))',
          sm: 'repeat(auto-fill, minmax(308px, .8fr))',
          smm: 'repeat(auto-fill, minmax(308px, 1fr))',
        },
      }}
      extraFilter={tagNames && <TagGroup tags={tags} tag={tag} setTag={setTag} />}
    />
  );
};
