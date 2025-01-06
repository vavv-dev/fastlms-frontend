import { ArrowRight, Recommend, Refresh } from '@mui/icons-material';
import { Avatar, Box, Button, Divider, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  AssetDisplayResponse,
  AssetDisplayResponse as AssetResponse,
  CourseDisplayResponse,
  CourseDisplayResponse as CourseResponse,
  ExamDisplayResponse,
  ExamDisplayResponse as ExamResponse,
  SharedGetDisplaysData as GetDisplaysData,
  SharedGetDisplaysResponse as GetDisplaysResponse,
  PlaylistDisplayResponse,
  PlaylistDisplayResponse as PlaylistResponse,
  QuizDisplayResponse,
  QuizDisplayResponse as QuizResponse,
  SurveyDisplayResponse,
  SurveyDisplayResponse as SurveyResponse,
  VideoDisplayResponse,
  VideoDisplayResponse as VideoResponse,
  sharedGetDisplays as getDisplays,
} from '@/api';
import { AssetCard } from '@/component/asset';
import { EmptyMessage, GridSlider, InfiniteScrollIndicator, useInfinitePagination } from '@/component/common';
import { CourseCard } from '@/component/course';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { PlaylistCard, VideoCard, VideoPlayer } from '@/component/video';
import { textEllipsisCss } from '@/helper/util';
import { channelState } from '@/store';

const GRID_SIZE: Record<string, number[]> = {
  video: [210, 4],
  short: [210, 4],
  playlist: [210, 4],
  exam: [308, 16],
  channel: [138, 16],
};

type FeaturedDisplayResponse =
  | VideoDisplayResponse
  | PlaylistDisplayResponse
  | AssetDisplayResponse
  | QuizDisplayResponse
  | SurveyDisplayResponse
  | ExamDisplayResponse
  | CourseDisplayResponse;

type Kind = 'video' | 'playlist' | 'asset' | 'quiz' | 'survey' | 'exam' | 'course';
type KindKey = Kind | 'short';

const kinds: Kind[] = ['video', 'playlist', 'asset', 'quiz', 'survey', 'exam', 'course'];
const kindKeys: KindKey[] = ['video', 'short', 'playlist', 'asset', 'quiz', 'survey', 'exam', 'course'];

export const Home = () => {
  const { t } = useTranslation('channel');
  const theme = useTheme();
  const navigate = useNavigate();
  const channel = useAtomValue(channelState);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mobileDown = useMediaQuery(theme.breakpoints.down('mobile'));

  const kindLabel = useMemo(
    () => ({
      video: t('Videos'),
      short: t('Short videos'),
      playlist: t('Playlists'),
      asset: t('Assets'),
      quiz: t('Quizzes'),
      survey: t('Surveys'),
      exam: t('Exams'),
      course: t('Courses'),
    }),
    [t],
  );

  const { data, mutate, isLoading, isValidating } = useInfinitePagination<GetDisplaysData, GetDisplaysResponse>({
    apiService: getDisplays,
    apiOptions: {
      kinds,
      filter: 'featured',
      channelOwner: channel?.owner.id,
      size: 9 * 8,
      page: 1, // first page only
    },
  });

  const kindItems = useMemo(() => {
    const items = kindKeys.reduce((acc, kind) => ({ ...acc, [kind]: [] }), {} as Record<KindKey, FeaturedDisplayResponse[]>);
    data?.forEach((pagination) => {
      pagination.items.forEach((item) => {
        if (!items[item.kind as Kind]) items[item.kind as Kind] = [];
        items[(item.kind == 'video' ? (item as VideoDisplayResponse).sub_kind : item.kind) as Kind].push(item);
      });
    });
    return items;
  }, [data]);

  if (!channel) return null;

  const isEmpty = Object.values(kindItems).every((items) => items.length === 0);
  const videoId = channel.resources.find((r) => r.kind === 'video')?.id;
  const relatedChannels = channel.resources.filter((r) => r.kind === 'channel');

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        p: 3,
        mb: 3,
        ...(mobileDown && {
          '& .grid-slider': { maxWidth: '-webkit-fill-available', display: 'grid', justifyContent: 'center' },
        }),
      }}
    >
      <Box sx={{ position: 'relative', maxWidth: 1280, mx: 'auto' }}>
        <Tooltip title={t('Refresh all content.')} placement="top-end" arrow>
          <IconButton onClick={() => mutate()} sx={{ color: 'primary.main', zIndex: 1, position: 'absolute', top: 0, right: 0 }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ top: '8em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <InfiniteScrollIndicator show={isLoading || isValidating} />
      </Box>

      <Stack
        direction="column"
        spacing={2}
        divider={<Divider flexItem />}
        sx={{ width: mobileDown ? '100%' : 'fit-content', mx: 'auto', '& .avatar-children': { pb: '1em' } }}
      >
        {(channel.welcome || videoId) && (
          <Welcome mobileDown={mobileDown} welcome={channel.welcome} videoId={videoId} containerRef={containerRef} />
        )}

        {!isEmpty &&
          Object.entries(kindItems).map(
            ([kind, resources]) =>
              resources.length > 0 && (
                <GridSlider
                  key={kind}
                  title={kindLabel[kind as Kind]}
                  itemWidth={mobileDown ? 344 : GRID_SIZE[kind]?.[0]}
                  itemGap={GRID_SIZE[kind]?.[1]}
                  containerRef={containerRef}
                  maxWidth={1280}
                  sx={{ mb: '1em !important' }}
                >
                  {resources?.map((resource) => {
                    if (['video', 'short'].includes(kind)) {
                      return (
                        <VideoCard
                          key={resource.id}
                          data={resource as VideoResponse}
                          hideAvatar
                          sx={kind === 'short' ? { '& .card-banner': { borderRadius: '16px' } } : {}}
                        />
                      );
                    } else if (kind === 'playlist') {
                      return (
                        <PlaylistCard
                          key={resource.id}
                          data={resource as PlaylistResponse}
                          hideAvatar
                          sx={{ '& > .card-banner': { mt: '6px' }, '& .avatar-children': { pb: 0 } }}
                        />
                      );
                    } else if (kind === 'asset') {
                      return <AssetCard key={resource.id} data={resource as AssetResponse} hideAvatar />;
                    } else if (kind === 'quiz') {
                      return <QuizCard key={resource.id} data={resource as QuizResponse} hideAvatar />;
                    } else if (kind === 'survey') {
                      return <SurveyCard key={resource.id} data={resource as SurveyResponse} hideAvatar />;
                    } else if (kind === 'exam') {
                      return (
                        <ExamCard
                          sx={{ '& .avatar-children': { pb: 0 } }}
                          key={resource.id}
                          data={resource as ExamResponse}
                          hideAvatar
                        />
                      );
                    } else if (kind === 'course') {
                      return <CourseCard key={resource.id} data={resource as CourseResponse} hideAvatar />;
                    }
                  })}
                </GridSlider>
              ),
          )}

        {relatedChannels.length > 0 && (
          <GridSlider title={t('Related Channels')} itemWidth={180} itemGap={16} containerRef={containerRef} maxWidth={1280}>
            {relatedChannels.map((channel) => (
              <Box
                onClick={() => navigate(`/channel/${channel.username}`)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer', alignItems: 'center' }}
                key={channel.id}
              >
                <Avatar src={channel.thumbnail} sx={{ width: 100, height: 100 }} />
                <Typography variant="subtitle1" sx={{ ...textEllipsisCss(2), lineHeight: 1.2, fontWeight: 600 }}>
                  {channel.title}
                </Typography>
              </Box>
            ))}
          </GridSlider>
        )}
      </Stack>
      {data?.[0]?.total == 0 && <EmptyMessage sx={{ my: 3 }} Icon={Recommend} message={t('No featured content yet.')} />}
    </Box>
  );
};

interface WelcomeProps {
  mobileDown: boolean;
  welcome: string | undefined;
  videoId: string | undefined;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const Welcome = memo(({ mobileDown, welcome, videoId, containerRef }: WelcomeProps) => {
  const { t } = useTranslation('channel');
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <GridSlider
      itemWidth={mobileDown ? 344 : GRID_SIZE['video'][0]}
      itemGap={GRID_SIZE['video'][1]}
      containerRef={containerRef}
      maxWidth={1280}
    >
      <Box
        sx={{
          gridColumn: '1 / -1',
          display: 'flex',
          gap: '2em',
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', mdl: 'row' },
        }}
      >
        {videoId && (
          <Box sx={{ width: !mobileDown ? '424px' : '100%', position: 'relative', flexShrink: 0, aspectRatio: '16/9', mb: 3 }}>
            <VideoPlayer id={videoId} sx={{ borderRadius: '8px', aspectRatio: '16/9' }} />
            <Button
              size="small"
              sx={{
                position: 'absolute',
                bottom: '-2.2em',
                left: 0,
                font: theme.typography.caption,
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={() => navigate(`/video/${videoId}`)}
            >
              {t('Go to video view')}
              <ArrowRight fontSize="small" />
            </Button>
          </Box>
        )}
        {welcome && <Box sx={{ mb: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: welcome }} />}
      </Box>
    </GridSlider>
  );
});
