import {
  ExamDisplayResponse as DisplayResponse,
  ExamGetDisplaysData as GetDisplaysData,
  examGetDisplays as getDisplays,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { GradingOutlined } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

export const Displays = () => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);
  const owner = user && user.id == homeUser?.id;

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="exam"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar={true} />))
      }
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 251px)',
          lg: 'repeat(4, minmax(251px, 308px))',
        },
      }}
      extraAction={
        owner && <Chip color="info" onClick={() => navigate('grading')} icon={<GradingOutlined />} label={t('Grade exams')} />
      }
    />
  );
};
