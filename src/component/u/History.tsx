import {
  AccountGetHistoryData,
  ExamDisplayResponse,
  QuizDisplayResponse,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  accountGetHistory,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { VideoCard } from '@/component/video';
import { Box, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { atom, useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

type HistoryDisplayResponse = VideoDisplayResponse | QuizDisplayResponse | SurveyDisplayResponse | ExamDisplayResponse;

const kindState = atom<'video' | 'quiz' | 'survey' | 'exam' | null>(null);

export const History = () => {
  const { t } = useTranslation('u');
  const theme = useTheme();
  const [kind, setKind] = useAtom(kindState);

  return (
    <GridInfiniteScrollPage<HistoryDisplayResponse, AccountGetHistoryData>
      pageKey="history"
      orderingOptions={[{ value: 'created', label: t('Recently viewed') }]}
      apiService={accountGetHistory}
      apiOptions={{ kind: kind, orderBy: 'created' }}
      renderItem={({ data }) => (
        <>
          <ToggleButtonGroup
            size="small"
            value={kind ? kind : ''}
            exclusive
            onChange={(_, v) => setKind(v ? v : null)}
            sx={{
              gridColumn: '1 / -1',
              width: '100%',
              mt: '-1.5em',
              '& .MuiButtonBase-root': {
                px: 2.5,
                py: 0.5,
                fontWeight: 'bold',
                '&.Mui-selected': {
                  color: 'background.paper',
                  bgcolor: theme.palette.text.primary,
                  '&:hover': { bgcolor: theme.palette.text.primary },
                },
              },
            }}
          >
            <ToggleButton value="">{t('All')}</ToggleButton>
            <ToggleButton value="video">{t('Video')}</ToggleButton>
            <ToggleButton value="quiz">{t('Quiz')}</ToggleButton>
            <ToggleButton value="survey">{t('Survey')}</ToggleButton>
            <ToggleButton value="exam">{t('Exam')}</ToggleButton>
          </ToggleButtonGroup>

          {data?.map((pagination) =>
            pagination.items?.map((item) => (
              <Box key={item.id} sx={{ mb: 1 }}>
                <HistoryCard item={item} />
              </Box>
            )),
          )}
        </>
      )}
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, minmax(210px, 1fr))',
        },
      }}
      boxPadding={0}
    />
  );
};

const HistoryCard = ({ item }: { item: HistoryDisplayResponse }) => {
  switch (item.kind) {
    case 'video':
      return <VideoCard data={{ ...(item as VideoDisplayResponse), video_kind: 'video' }} />;
    case 'quiz':
      return <QuizCard data={item as QuizDisplayResponse} />;
    case 'survey':
      return <SurveyCard data={item as SurveyDisplayResponse} />;
    case 'exam':
      return <ExamCard data={item as ExamDisplayResponse} bannerPlace="top" />;
    default:
  }
};
