import { SearchSearchVideoContentData, VideoSearchResultResponse, searchSearchVideoContent } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { durationToSeconds } from '@/helper/util';
import { Box, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VideoCard from './VideoCard';

const VideoSearchResult = () => {
  const { t } = useTranslation('video');
  const navigate = useNavigate();
  const search = useSearchParams()[0].get('q');
  const theme = useTheme();

  const highlight = (searchedText: string, s: string) => {
    const escapedSearch = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanedText = searchedText.replace(/<mark>(.*?)<\/mark>/g, '$1');
    const regex = new RegExp(escapedSearch, 'gi');
    return cleanedText.replace(regex, (match: string) => `<mark>${match}</mark>`);
  };

  return (
    <GridInfiniteScrollPage<VideoSearchResultResponse, SearchSearchVideoContentData>
      pageKey="search"
      pageHeader={
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('Search')}
        </Typography>
      }
      orderingOptions={[
        { value: 'relevance', label: t('Most relevant') },
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      disableSearch={true}
      apiService={searchSearchVideoContent}
      apiOptions={search ? { q: search } : undefined}
      renderItem={({ data }) => {
        if (data && data[0].items.length === 0) {
          return (
            <Box sx={{ my: 3, textAlign: 'center' }}>
              {search ? (
                <Typography variant="h6">{t('No search result by "{{ search }}".', { search })}</Typography>
              ) : (
                <Typography variant="h6">{t('Search within video content.')}</Typography>
              )}
            </Box>
          );
        }

        return data?.map((pagination) =>
          pagination.items?.map((video) => (
            <Box key={video.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              <VideoCard
                video={video}
                to={`/video/${video.id}`}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  gap: '1em',
                  '.card-banner': {
                    width: '220px',
                    minWidth: '220px',
                    height: 'auto',
                    '& img': { borderRadius: theme.shape.borderRadius / 2 },
                  },
                  '.content-title': { fontSize: '1em', mb: 0.5, fontWeight: 600, lineHeight: 1.2 },
                }}
                showDescription={true}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', rowGap: 1 }}>
                {video.found_subtitles?.map((found) => (
                  <Chip
                    size="small"
                    key={found.start}
                    sx={{ px: 0.3 }}
                    label={
                      <Typography variant="subtitle2" sx={{ display: 'flex' }}>
                        <Box color="primary" sx={{ fontWeight: 700, mr: 1, color: 'primary.dark' }}>
                          {found.start.replace('00:', '')}
                        </Box>
                        <Tooltip title={found.text}>
                          <Box
                            sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            dangerouslySetInnerHTML={{ __html: highlight(found.text, search || '') }}
                          />
                        </Tooltip>
                      </Typography>
                    }
                    variant="filled"
                    onClick={() => navigate(`/video/${video.id}?t=${durationToSeconds(found.start)}`)}
                  />
                ))}
              </Box>
            </Box>
          )),
        );
      }}
      gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
    />
  );
};

export default VideoSearchResult;
