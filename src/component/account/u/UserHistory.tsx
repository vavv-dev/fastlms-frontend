import { HistoryOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';
import { atom, useAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AssetDisplayResponse,
  CourseDisplayResponse,
  ExamDisplayResponse,
  PlaylistDisplayResponse,
  QuizDisplayResponse,
  SharedGetDisplaysData,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  sharedGetDisplays,
} from '@/api';
import { AssetCard } from '@/component/asset';
import { EmptyMessage, GridInfiniteScrollPage, TagGroup } from '@/component/common';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { VideoCard } from '@/component/video';

type HistoryDisplayResponse =
  | VideoDisplayResponse
  | PlaylistDisplayResponse
  | AssetDisplayResponse
  | QuizDisplayResponse
  | SurveyDisplayResponse
  | ExamDisplayResponse
  | CourseDisplayResponse;

type Kind = 'video' | 'asset' | 'quiz' | 'survey' | 'exam' | null;

const kindState = atom<Kind>(null);

export const UserHistory = () => {
  const { t } = useTranslation('account');
  const [kind, setKind] = useAtom(kindState);

  return (
    <GridInfiniteScrollPage<HistoryDisplayResponse, SharedGetDisplaysData>
      pageKey="history"
      apiService={sharedGetDisplays}
      apiOptions={{ kinds: kind ? [kind] : ['video', 'asset', 'quiz', 'survey', 'exam'], filter: 'history' }}
      swrInfiniteOption={{ revalidateOnMount: true }}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Box
              key={item.id}
              sx={{ maxWidth: '344px', justifySelf: { xs: 'center', sm: 'inherit' }, width: '100%', margin: '0 auto' }}
            >
              <Card item={item} />
            </Box>
          )),
        )
      }
      emptyMessage={<EmptyMessage Icon={HistoryOutlined} message={t('No history found.')} />}
      gridBoxSx={{
        gap: '2em 0.5em',
        gridTemplateColumns: {
          xs: 'repeat(1, minmax(0, 1fr))',
          sm: 'repeat(auto-fill, minmax(210px, 1fr))',
        },
      }}
      boxPadding={0}
      extraFilter={<HistoryFilter kind={kind} setKind={setKind} />}
    />
  );
};

const Card = ({ item }: { item: HistoryDisplayResponse }) => {
  switch (item.kind) {
    case 'video':
      return <VideoCard data={{ ...(item as VideoDisplayResponse), sub_kind: 'video' }} />;
    case 'asset':
      return <AssetCard data={item as AssetDisplayResponse} />;
    case 'quiz':
      return <QuizCard data={item as QuizDisplayResponse} />;
    case 'survey':
      return <SurveyCard data={item as SurveyDisplayResponse} />;
    case 'exam':
      return <ExamCard data={item as ExamDisplayResponse} bannerPlace="top" />;
    default:
  }
};

interface HistoryFilterProps {
  kind: Kind;
  setKind: (kind: Kind) => void;
}

const HistoryFilter = ({ kind, setKind }: HistoryFilterProps) => {
  const { t } = useTranslation('account');
  const kinds = useMemo(
    () => [
      ['', t('All')],
      ['video', t('Video')],
      ['asset', t('Asset')],
      ['quiz', t('Quiz')],
      ['survey', t('Survey')],
      ['exam', t('Exam')],
    ],
    [t],
  );

  return <TagGroup tags={kinds} tag={kind || ''} setTag={setKind as (tag: string) => void} />;
};
