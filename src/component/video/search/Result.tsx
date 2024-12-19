import { Search } from '@mui/icons-material';
import { Box, Chip, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Card } from '../Card';

import {
  VideoSearchResultResponse as SearchResultResponse,
  SearchSearchVideoContentData as SearchVideoContentData,
  searchSearchVideoContent as searchVideoContent,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { durationToSeconds, stripHtml } from '@/helper/util';

export const Result = () => {
  const { t } = useTranslation('video');
  const navigate = useNavigate();
  const search = useSearchParams()[0].get('q');
  const theme = useTheme();
  const mobileUp = useMediaQuery(theme.breakpoints.up('mobile'));

  const highlight = (searchedText: string, s: string) => {
    const sWithoutSpace = s.replace(/\s+/g, '');
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    const escapedSearch = escapeRegExp(s);
    const escapedSearchNoSpace = escapeRegExp(sWithoutSpace);
    const cleanedText = searchedText.replace(/<mark>(.*?)<\/mark>/g, '$1');
    const regex = new RegExp(`${escapedSearch}|${escapedSearchNoSpace}`, 'gi');
    return cleanedText.replace(regex, (match: string) => `<mark>${match}</mark>`);
  };

  return (
    <GridInfiniteScrollPage<SearchResultResponse, SearchVideoContentData>
      pageKey="search"
      pageHeader={
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('Search')}
        </Typography>
      }
      orderingOptions={[{ value: 'relevance', label: t('Most relevant') }]}
      disableSearch
      apiService={searchVideoContent}
      apiOptions={search ? { q: search } : undefined}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              <Card
                data={item}
                to={`/video/${item.id}`}
                sx={
                  mobileUp
                    ? {
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        gap: '1em',
                        '.card-banner': {
                          width: '220px',
                          minWidth: '220px',
                          height: 'auto',
                          '& img': { borderRadius: theme.shape.borderRadius / 2, aspectRatio: '16 / 9' },
                        },
                        '.content-title': { fontSize: '1em', mb: 0.5, fontWeight: 600, lineHeight: 1.2 },
                      }
                    : {}
                }
                showDescription
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', rowGap: 1 }}>
                {item.search_subtitles?.map((found) => (
                  <Chip
                    size="small"
                    key={found.position}
                    sx={{ px: 0.3 }}
                    label={
                      <Typography variant="subtitle2" sx={{ display: 'flex' }}>
                        <Box
                          sx={{
                            fontWeight: 700,
                            mr: 1,
                            color: 'primary.dark',
                          }}
                        >
                          {found.position.replace('00:', '')}
                        </Box>
                        <Tooltip title={stripHtml(found.line)}>
                          <Box
                            sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            dangerouslySetInnerHTML={{ __html: highlight(stripHtml(found.line), search || '') }}
                          />
                        </Tooltip>
                      </Typography>
                    }
                    variant="filled"
                    onClick={() => navigate(`/video/${item.id}?t=${durationToSeconds(found.position)}`)}
                  />
                ))}
              </Box>
            </Box>
          )),
        )
      }
      emptyMessage={<EmptyMessage Icon={Search} message={t('No search result by "{{ search }}".', { search })} />}
      gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
    />
  );
};
