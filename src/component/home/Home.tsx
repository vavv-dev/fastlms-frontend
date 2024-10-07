import {
  AssetDisplayResponse,
  CourseDisplayResponse,
  ExamDisplayResponse,
  ChannelGetContentData as GetContentData,
  ChannelGetContentResponse as GetContentResponse,
  PlaylistDisplayResponse,
  QuizDisplayResponse,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  channelGetContent as getDisplays,
} from '@/api';
import { GridSlider, useServiceImmutable } from '@/component/common';
import { CourseCard } from '@/component/course';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { PlaylistCard, VideoCard } from '@/component/video';
import { Box, Divider, Stack, Theme, Typography, useMediaQuery } from '@mui/material';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AssetCard } from '../asset';

const GIRD_SIZE: Record<string, number[]> = {
  short: [210, 4],
  exam: [308, 16],
};

export const Home = () => {
  const { t } = useTranslation('home');
  const { data } = useServiceImmutable<GetContentData, GetContentResponse>(getDisplays, undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  if (!data) return null;

  return (
    <Box ref={containerRef} sx={{ width: '100%', p: 3, maxWidth: 2000 + 64, mx: 'auto' }}>
      <Stack direction="column" spacing={2} divider={<Divider flexItem />} sx={{ width: 'fit-content', mx: 'auto' }}>
        {Object.entries(data).map(
          ([kind, resources]) =>
            resources.length > 0 && (
              <GridSlider
                key={kind}
                title={
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                    {t(kind)}
                  </Typography>
                }
                itemWidth={smDown && (kind == 'video' || kind == 'short' || kind == 'playlist') ? 210 : GIRD_SIZE[kind]?.[0]}
                itemGap={GIRD_SIZE[kind]?.[1]}
                containerRef={containerRef}
                disableSlider
                sx={{ mb: '2em !important' }}
              >
                {resources?.map((resource) => {
                  if (['video', 'short'].includes(kind)) {
                    return (
                      <VideoCard
                        key={resource.id}
                        data={resource as VideoDisplayResponse}
                        sx={kind === 'short' ? { '& .card-banner': { borderRadius: '16px' } } : {}}
                      />
                    );
                  } else if (kind === 'playlist') {
                    return (
                      <PlaylistCard
                        key={resource.id}
                        data={resource as PlaylistDisplayResponse}
                        sx={{ '& > .card-banner': { mt: '6px' } }}
                      />
                    );
                  } else if (kind === 'asset') {
                    return <AssetCard key={resource.id} data={resource as AssetDisplayResponse} />;
                  } else if (kind === 'quiz') {
                    return <QuizCard key={resource.id} data={resource as QuizDisplayResponse} />;
                  } else if (kind === 'survey') {
                    return <SurveyCard key={resource.id} data={resource as SurveyDisplayResponse} />;
                  } else if (kind === 'exam') {
                    return <ExamCard key={resource.id} data={resource as ExamDisplayResponse} />;
                  } else if (kind === 'course') {
                    return <CourseCard key={resource.id} data={resource as CourseDisplayResponse} />;
                  }
                })}
              </GridSlider>
            ),
        )}
      </Stack>
    </Box>
  );
};
