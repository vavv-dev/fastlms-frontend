import {
  AccountGetHistoryData,
  AssetDisplayResponse,
  CourseDisplayResponse,
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
import { AssetCard } from '../asset';
import { CourseCard } from '../course';

type HistoryDisplayResponse =
  | VideoDisplayResponse
  | AssetDisplayResponse
  | QuizDisplayResponse
  | SurveyDisplayResponse
  | ExamDisplayResponse
  | CourseDisplayResponse;

type Kind = 'video' | 'asset' | 'quiz' | 'survey' | 'exam' | 'course' | null;

const kindState = atom<Kind>(null);

export const History = () => {
  const [kind, setKind] = useAtom(kindState);

  return (
    <GridInfiniteScrollPage<HistoryDisplayResponse, AccountGetHistoryData>
      pageKey="history"
      apiService={accountGetHistory}
      apiOptions={{ kind, orderBy: 'created' }}
      renderItem={({ data }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Box key={item.id} sx={{ mb: 1 }}>
              <Card item={item} />
            </Box>
          )),
        )
      }
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
    case 'course':
      return <CourseCard data={item as CourseDisplayResponse} />;
    default:
  }
};

interface HistoryFilterProps {
  kind: Kind;
  setKind: (kind: Kind) => void;
}

const HistoryFilter = ({ kind, setKind }: HistoryFilterProps) => {
  const { t } = useTranslation('u');
  const theme = useTheme();
  return (
    <ToggleButtonGroup
      size="small"
      value={kind ? kind : ''}
      exclusive
      onChange={(_, v) => setKind(v || null)}
      sx={{
        gridColumn: '1 / -1',
        width: '100%',
        '& .MuiButtonBase-root': {
          whiteSpace: 'nowrap',
          px: 2,
          py: 0.2,
          fontWeight: 'bold',
          '&.Mui-selected': {
            color: 'background.paper',
            bgcolor: theme.palette.text.primary,
            '&:hover': { bgcolor: theme.palette.text.primary },
          },
          '&.MuiButtonBase-root ': { borderRadius: '8px', borderColor: theme.palette.divider },
          '&.MuiButtonBase-root+.MuiButtonBase-root': { ml: 1 },
        },
        alignItems: 'center',
      }}
    >
      <ToggleButton value="">{t('All')}</ToggleButton>
      <ToggleButton value="video">{t('Video')}</ToggleButton>
      <ToggleButton value="asset">{t('Asset')}</ToggleButton>
      <ToggleButton value="quiz">{t('Quiz')}</ToggleButton>
      <ToggleButton value="survey">{t('Survey')}</ToggleButton>
      <ToggleButton value="exam">{t('Exam')}</ToggleButton>
      <ToggleButton value="course">{t('Course')}</ToggleButton>
    </ToggleButtonGroup>
  );
};
