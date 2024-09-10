import {
  CourseDisplayResponse,
  ExamDisplayResponse,
  ChannelGetDisplaysData as GetDisplaysData,
  ChannelGetDisplaysResponse as GetDisplaysResponse,
  PlaylistDisplayResponse,
  QuizDisplayResponse,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  channelGetDisplays as getDisplays,
} from '@/api';
import { GridSlider, useServiceImmutable } from '@/component/common';
import { CourseCard } from '@/component/course';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { PlaylistCard, VideoCard } from '@/component/video';
import { homeUserState } from '@/store';
import { Box, Divider, Stack } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const GIRD_SIZE: Record<string, number[]> = {
  video: [210, 4],
  short: [210, 4],
  playlist: [210, 4],
  exam: [308, 16],
};

export const Home = () => {
  const { t } = useTranslation('channel');
  const homeUser = useAtomValue(homeUserState);
  const { data } = useServiceImmutable<GetDisplaysData, GetDisplaysResponse>(getDisplays, {
    ownerId: homeUser?.id as number,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!homeUser || !data) return null;

  return (
    <Box ref={containerRef} sx={{ width: '100%', p: 3 }}>
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
              >
                {resources?.map((resource) => {
                  if (['video', 'short'].includes(kind)) {
                    return (
                      <VideoCard
                        key={resource.id}
                        data={resource as VideoDisplayResponse}
                        hideAvatar
                        sx={kind === 'short' ? { '& .card-banner': { borderRadius: '16px' } } : {}}
                      />
                    );
                  } else if (kind === 'playlist') {
                    return (
                      <PlaylistCard
                        key={resource.id}
                        data={resource as PlaylistDisplayResponse}
                        hideAvatar
                        sx={{ '& > .card-banner': { mt: '6px' }, '& .avatar-children': { pb: 0 } }}
                      />
                    );
                  } else if (kind === 'quiz') {
                    return <QuizCard key={resource.id} data={resource as QuizDisplayResponse} hideAvatar />;
                  } else if (kind === 'survey') {
                    return <SurveyCard key={resource.id} data={resource as SurveyDisplayResponse} hideAvatar />;
                  } else if (kind === 'exam') {
                    return (
                      <ExamCard
                        sx={{ '& .avatar-children': { pb: 0 } }}
                        key={resource.id}
                        data={resource as ExamDisplayResponse}
                        hideAvatar
                      />
                    );
                  } else if (kind === 'course') {
                    return <CourseCard key={resource.id} data={resource as CourseDisplayResponse} hideAvatar />;
                  }
                })}
              </GridSlider>
            ),
        )}
      </Stack>
    </Box>
  );
};
