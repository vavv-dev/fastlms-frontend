import {
  AccountGetHistoryData,
  AssetDisplayResponse,
  ExamDisplayResponse,
  QuizDisplayResponse,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  accountGetHistory,
} from '@/api';
import { AssetCard } from '@/component/asset';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { VideoCard } from '@/component/video';
import { HistoryOutlined } from '@mui/icons-material';
import { Badge, Box, Button, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { atom, useAtom } from 'jotai';
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

export const History = () => {
  const { t } = useTranslation('u');
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
  const { t } = useTranslation('u');
  const navigate = useNavigate();
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
          '&.MuiButtonBase-root': { borderRadius: '8px', borderColor: theme.palette.divider },
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
      <Badge
        badgeContent={0} // TODO: Implement this
        color="error"
        sx={{ ml: 1, '& .MuiBadge-badge': { top: 6 } }}
      >
        <Button
          onClick={() => navigate('/u/course')}
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
    </ToggleButtonGroup>
  );
};
