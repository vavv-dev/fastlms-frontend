import {
  VideoDisplayResponse as DisplayResponse,
  videoGetDisplays as getDisplays,
  VideoGetDisplaysData as GetDisplaysData,
  videoGetTags as getTags,
  VideoGetTagsData as GetTagsData,
  VideoGetTagsResponse as GetTagsResponse,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, useServiceImmutable } from '@/component/common';
import { VideoCard } from '@/component/video';
import { VideoLibrary } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { atom, useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

const tagState = atom<string>('');

export const Video = () => {
  const { t } = useTranslation('home');
  const { data: tagNames } = useServiceImmutable<GetTagsData, GetTagsResponse>(getTags, { limit: 8 });
  const [tag, setTag] = useAtom(tagState);

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
              data={{ ...item, video_kind: 'video' }}
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
          xs: 'repeat(1, 450px)',
          sm: 'repeat(auto-fill, minmax(308px, .8fr))',
          smm: 'repeat(auto-fill, minmax(308px, 1fr))',
        },
      }}
      extraFilter={tagNames && <TagGroup tagNames={tagNames} tag={tag} setTag={setTag} />}
    />
  );
};

interface TagGroupProps {
  tagNames: string[];
  tag: string | null;
  setTag: (tag: string) => void;
}

const TagGroup = ({ tagNames, tag, setTag }: TagGroupProps) => {
  const { t } = useTranslation('home');
  const theme = useTheme();

  return (
    <ToggleButtonGroup
      value={tag}
      exclusive
      onChange={(_, v) => setTag(v ? v : '')}
      sx={{
        '& .MuiButtonBase-root': {
          whiteSpace: 'nowrap',
          px: 2,
          py: 0.3,
          my: 1,
          fontWeight: 'bold',
          '&.Mui-selected': {
            color: 'background.paper',
            bgcolor: theme.palette.text.primary,
            '&:hover': { bgcolor: theme.palette.text.primary },
          },
          '&.MuiButtonBase-root ': { borderRadius: '8px', borderColor: theme.palette.divider },
          '&.MuiButtonBase-root+.MuiButtonBase-root': { ml: 1 },
        },
      }}
    >
      <ToggleButton value="">{t('All')}</ToggleButton>
      <ToggleButton value="featured">{t('Featured')}</ToggleButton>
      <ToggleButton value="watched">{t('Watched video')}</ToggleButton>
      {tagNames.map((name) => (
        <ToggleButton key={name} value={name}>
          {name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
