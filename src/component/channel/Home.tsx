import {
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
import { GridSlider, useServiceImmutable } from '@/component/common';
import { CourseCard } from '@/component/course';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { PlaylistCard, VideoCard } from '@/component/video';
import { homeUserState } from '@/store';
import { Refresh } from '@mui/icons-material';
import { Box, Divider, IconButton, Stack, Tooltip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const GIRD_SIZE: Record<string, number[]> = {
  video: [210, 4],
  short: [210, 4],
  playlist: [210, 4],
  exam: [308, 16],
  channel: [138, 16],
};

export const Home = () => {
  const { t } = useTranslation('channel');
  const homeUser = useAtomValue(homeUserState);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data, mutate } = useServiceImmutable<GetContentData, GetContentResponse>(GetContent, {
    ownerId: homeUser?.id as number,
  });

  if (!homeUser || !data) return null;

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
        {Object.entries(data).map(
          ([kind, resources]) =>
            resources.length > 0 && (
              <GridSlider
                key={kind}
                title={t(kind)}
                itemWidth={GIRD_SIZE[kind]?.[0]}
                itemGap={GIRD_SIZE[kind]?.[1]}
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
    </Box>
  );
};
