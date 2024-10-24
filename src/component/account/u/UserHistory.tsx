import {
  AccountGetHistoryData,
  AssetDisplayResponse,
  CourseGetNewEnrolledCountData,
  ExamDisplayResponse,
  QuizDisplayResponse,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  accountGetHistory,
  courseGetNewEnrolledCount,
} from '@/api';
import { AssetCard } from '@/component/asset';
import { EmptyMessage, GridInfiniteScrollPage, TagGroup, useServiceImmutable } from '@/component/common';
import { ExamCard } from '@/component/exam';
import { notificationsState } from '@/component/notification';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { VideoCard } from '@/component/video';
import { ArrowRight, FiberSmartRecord, HistoryOutlined } from '@mui/icons-material';
import { Badge, Box, Button, Typography, useTheme } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type HistoryDisplayResponse =
  | VideoDisplayResponse
  | AssetDisplayResponse
  | QuizDisplayResponse
  | SurveyDisplayResponse
  | ExamDisplayResponse;

type Kind = 'video' | 'asset' | 'quiz' | 'survey' | 'exam' | null;

const kindState = atom<Kind>(null);

export const UserHistory = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [kind, setKind] = useAtom(kindState);
  const notifications = useAtomValue(notificationsState);

  // unread notification count
  const unReadCount = notifications.filter((n) => !n.read_time).length;

  return (
    <GridInfiniteScrollPage<HistoryDisplayResponse, AccountGetHistoryData>
      pageKey="history"
      apiService={accountGetHistory}
      apiOptions={{ kind, orderBy: 'created' }}
      renderItem={({ data }) => (
        <>
          {!!unReadCount && (
            <Box
              sx={{
                borderRadius: 1,
                gridColumn: '1 / -1',
                p: 3,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiberSmartRecord color="error" />
              <Typography variant="body1">{t('You have {{ count }} unread notifications.', { count: unReadCount })}</Typography>
              <Button endIcon={<ArrowRight />} onClick={() => navigate('/u/notification')}>
                {t('Read here')}
              </Button>
            </Box>
          )}
          {data?.map((pagination) =>
            pagination.items?.map((item) => (
              <Box key={item.id} sx={{ mb: 1 }}>
                <Card item={item} />
              </Box>
            )),
          )}
        </>
      )}
      emptyMessage={<EmptyMessage Icon={HistoryOutlined} message={t('No history found.')} />}
      gridBoxSx={{
        gap: '2em 0.5em',
        gridTemplateColumns: {
          xs: 'repeat(1, 344px)',
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
      return <VideoCard data={{ ...(item as VideoDisplayResponse), video_kind: 'video' }} />;
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
  const theme = useTheme();
  const navigate = useNavigate();
  const { data, mutate } = useServiceImmutable<CourseGetNewEnrolledCountData, number>(courseGetNewEnrolledCount, undefined);

  const goToCourses = () => {
    navigate('/u/course');
    // After user see the count badge, just hide it
    mutate(0, { revalidate: false });
  };

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

  return (
    <TagGroup
      tags={kinds}
      tag={kind || ''}
      setTag={setKind as (tag: string) => void}
      extraButtions={
        <Badge badgeContent={data} color="error" sx={{ ml: 1, '& .MuiBadge-badge': { top: 10 } }}>
          <Button
            onClick={goToCourses}
            sx={{
              background: 'linear-gradient(90deg, #e0f7fa 0%, #ffcdd2 100%)',
              boxShadow: `inset 0 0 0 1px ${theme.palette.divider}`,
              color: theme.palette.text.primary,
              '&:hover': { background: 'linear-gradient(90deg, #b2ebf2 0%, #ef9a9a 100%)' },
            }}
          >
            {t('My courses')}
          </Button>
        </Badge>
      }
    />
  );
};
