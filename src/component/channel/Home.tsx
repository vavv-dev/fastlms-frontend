import {
  AssetDisplayResponse as AssetResponse,
  CourseDisplayResponse as CourseResponse,
  ExamDisplayResponse as ExamResponse,
  channelGetContent as GetContent,
  ChannelGetContentData as GetContentData,
  ChannelGetContentResponse as GetContentResponse,
  PlaylistDisplayResponse as PlaylistResponse,
  QuizDisplayResponse as QuizResponse,
  SurveyDisplayResponse as SurveyResponse,
  VideoDisplayResponse as VideoResponse,
} from '@/api';
import { AssetCard } from '@/component/asset';
import { EmptyMessage, GridSlider, useServiceImmutable } from '@/component/common';
import { CourseCard } from '@/component/course';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { PlaylistCard, VideoCard, VideoPlayer, VideoTracking } from '@/component/video';
import { channelState } from '@/store';
import { ArrowRight, Recommend, Refresh } from '@mui/icons-material';
import { Box, Button, Divider, IconButton, Stack, Tooltip, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const GRID_SIZE: Record<string, number[]> = {
  video: [210, 4],
  short: [210, 4],
  playlist: [210, 4],
  exam: [308, 16],
  channel: [138, 16],
};

export const Home = () => {
  const { t } = useTranslation('channel');
  const theme = useTheme();
  const navigate = useNavigate();
  const channel = useAtomValue(channelState);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data, mutate } = useServiceImmutable<GetContentData, GetContentResponse>(GetContent, {
    ownerId: channel?.owner.id as string,
  });

  if (!channel || !data) return null;

  const isEmpty = Object.values(data).every((v) => v.length === 0);
  const videoId = channel.resources[0]?.id;

  return (
    <Box ref={containerRef} sx={{ width: '100%', p: 3 }}>
      <Box sx={{ position: 'relative', maxWidth: 1280, mx: 'auto' }}>
        <Tooltip title={t('Refresh all content.')} placement="top-end" arrow>
          <IconButton onClick={() => mutate()} sx={{ color: 'primary.main', zIndex: 1, position: 'absolute', top: 0, right: 0 }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Stack
        direction="column"
        spacing={2}
        divider={<Divider flexItem />}
        sx={{ width: 'fit-content', mx: 'auto', '& .avatar-children': { pb: '1em' } }}
      >
        {(channel.welcome || channel.resources.length > 0) && (
          <GridSlider
            itemWidth={GRID_SIZE['video'][0]}
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
                <Box sx={{ position: 'relative', flexShrink: 0, height: '238px', aspectRatio: '16/9', mb: 3 }}>
                  <VideoPlayer id={videoId} sx={{ borderRadius: '8px', aspectRatio: '16/9' }} />
                  <VideoTracking id={videoId} hidden />
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
              {channel.welcome && (
                <Box sx={{ mb: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: channel.welcome }} />
              )}
            </Box>
          </GridSlider>
        )}

        {!isEmpty &&
          Object.entries(data).map(
            ([kind, resources]) =>
              resources.length > 0 && (
                <GridSlider
                  key={kind}
                  title={t(kind)}
                  itemWidth={GRID_SIZE[kind]?.[0]}
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
      </Stack>
      {isEmpty && <EmptyMessage sx={{ my: 3 }} Icon={Recommend} message={t('No featured content yet.')} />}
    </Box>
  );
};
